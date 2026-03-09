import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateTpsDto } from './dto/create-tps.dto';
import { RecordWasteDto } from './dto/record-waste.dto';
import { UpdateTpsDto } from './dto/update-tps.dto';
import { randomUUID } from 'crypto';
import { buildPaginatedQuery } from '../../common/utils/query-builder.util';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class TpsService {
  constructor(private readonly dataSource: DataSource) {}

  async createTps(tenantSchema: string, dto: CreateTpsDto) {
    const qrCode = `TPS-${randomUUID().split('-')[0]}`;

    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".tps_locations (name, type, address, area_id, coordinates, capacity_tons, qr_code)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8)
       RETURNING id, name, type, status, address, area_id, capacity_tons, current_load_tons, qr_code, created_at`,
      [dto.name, dto.type, dto.address, dto.areaId, dto.longitude, dto.latitude, dto.capacityTons, qrCode],
    );

    return result[0];
  }

  async recordWaste(tenantSchema: string, dto: RecordWasteDto) {
    // Insert into transfer_records as a simple waste log
    await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transfer_records (source_tps_id, category, volume_kg, status, checkpoint_at)
       VALUES ($1, $2, $3, 'verified', NOW())`,
      [dto.tpsId, dto.category, dto.volumeKg],
    );

    // Update current_load_tons
    const operator = dto.direction === 'in' ? '+' : '-';
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".tps_locations
       SET current_load_tons = GREATEST(0, current_load_tons ${operator} $1), updated_at = NOW()
       WHERE id = $2
       RETURNING current_load_tons`,
      [dto.volumeKg / 1000, dto.tpsId],
    );

    return result[0];
  }

  async listTps(tenantSchema: string, filters: { areaId?: string; type?: string; status?: string }) {
    let query = `SELECT id, name, type, status, address, area_id, capacity_tons, current_load_tons, qr_code,
                 ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude, created_at
                 FROM "${tenantSchema}".tps_locations WHERE 1=1`;
    const params: any[] = [];

    if (filters.areaId) {
      params.push(filters.areaId);
      query += ` AND area_id = $${params.length}`;
    }
    if (filters.type) {
      params.push(filters.type);
      query += ` AND type = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY name';
    const results = await this.dataSource.query(query, params);

    return results.map((tps: any) => ({
      ...tps,
      nearCapacity: tps.capacity_tons > 0 && (tps.current_load_tons / tps.capacity_tons) > 0.8,
    }));
  }

  async listTpsPaginated(
    tenantSchema: string,
    query: PaginationQueryDto,
    filters?: Record<string, string>,
  ): Promise<PaginatedResponse<any>> {
    const result = await buildPaginatedQuery(this.dataSource, {
      baseQuery: `SELECT id, name, type, status, address, area_id, capacity_tons, current_load_tons, qr_code, ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude, created_at FROM "${tenantSchema}".tps_locations`,
      countQuery: `SELECT COUNT(*) FROM "${tenantSchema}".tps_locations`,
      searchableColumns: ['name', 'address'],
      sortableColumns: ['name', 'type', 'status', 'capacity_tons', 'current_load_tons', 'created_at'],
      filterableColumns: ['type', 'status', 'area_id'],
      defaultSort: 'name',
      defaultOrder: 'asc',
    }, {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      search: query.search,
      filters,
    });
    result.data = result.data.map((tps: any) => ({
      ...tps,
      nearCapacity: tps.capacity_tons > 0 && (tps.current_load_tons / tps.capacity_tons) > 0.8,
    }));
    return result;
  }

  async getMapSummary(tenantSchema: string) {
    const results = await this.dataSource.query(
      `SELECT id, name, type, status, capacity_tons, current_load_tons,
              ST_Y(coordinates::geometry) as latitude,
              ST_X(coordinates::geometry) as longitude
       FROM "${tenantSchema}".tps_locations
       ORDER BY name`,
      [],
    );
    return results.map((tps: any) => ({
      ...tps,
      fill_percent: tps.capacity_tons > 0
        ? Math.round((tps.current_load_tons / tps.capacity_tons) * 100)
        : 0,
    }));
  }

  async findNearby(tenantSchema: string, lat: number, lng: number, radiusMeters: number = 1000) {
    return this.dataSource.query(
      `SELECT id, name, type, status, address, capacity_tons, current_load_tons, qr_code,
       ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude,
       ST_Distance(coordinates::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters
       FROM "${tenantSchema}".tps_locations
       WHERE ST_DWithin(coordinates::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance_meters`,
      [lng, lat, radiusMeters],
    );
  }

  async getTpsById(tenantSchema: string, id: string) {
    const result = await this.dataSource.query(
      `SELECT id, name, type, status, address, area_id, capacity_tons, current_load_tons, qr_code,
       ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude, created_at
       FROM "${tenantSchema}".tps_locations WHERE id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('TPS tidak ditemukan');
    return result[0];
  }

  async updateTps(tenantSchema: string, id: string, dto: UpdateTpsDto) {
    // Verify TPS exists
    await this.getTpsById(tenantSchema, id);

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      params.push(dto.name);
    }
    if (dto.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      params.push(dto.type);
    }
    if (dto.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(dto.status);
    }
    if (dto.address !== undefined) {
      setClauses.push(`address = $${paramIndex++}`);
      params.push(dto.address);
    }
    if (dto.areaId !== undefined) {
      setClauses.push(`area_id = $${paramIndex++}`);
      params.push(dto.areaId);
    }
    if (dto.capacityTons !== undefined) {
      setClauses.push(`capacity_tons = $${paramIndex++}`);
      params.push(dto.capacityTons);
    }
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      setClauses.push(`coordinates = ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)`);
      params.push(dto.longitude, dto.latitude);
    }

    if (setClauses.length === 0) {
      return this.getTpsById(tenantSchema, id);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".tps_locations
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, type, status, address, area_id,
         ST_Y(coordinates::geometry) as latitude,
         ST_X(coordinates::geometry) as longitude,
         capacity_tons, current_load_tons, qr_code, created_at, updated_at`,
      params,
    );

    return result[0];
  }
}
