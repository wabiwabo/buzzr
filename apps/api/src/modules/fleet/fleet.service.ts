import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class FleetService {
  constructor(private readonly dataSource: DataSource) {}

  async createVehicle(tenantSchema: string, dto: CreateVehicleDto) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".vehicles (plate_number, type, capacity_tons)
       VALUES ($1, $2, $3)
       RETURNING id, plate_number, type, capacity_tons, driver_id, is_active, created_at`,
      [dto.plateNumber, dto.type, dto.capacityTons],
    );
    return result[0];
  }

  async assignDriver(tenantSchema: string, vehicleId: string, driverId: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".vehicles SET driver_id = $1 WHERE id = $2 RETURNING *`,
      [driverId, vehicleId],
    );
    if (!result.length) throw new NotFoundException('Kendaraan tidak ditemukan');
    return result[0];
  }

  async unassignDriver(tenantSchema: string, vehicleId: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".vehicles SET driver_id = NULL WHERE id = $1 RETURNING *`,
      [vehicleId],
    );
    if (!result.length) throw new NotFoundException('Kendaraan tidak ditemukan');
    return result[0];
  }

  async listVehicles(tenantSchema: string, filters: { type?: string }) {
    let query = `SELECT v.id, v.plate_number, v.type, v.capacity_tons, v.driver_id, v.is_active, v.created_at,
                 u.name as driver_name
                 FROM "${tenantSchema}".vehicles v
                 LEFT JOIN "${tenantSchema}".users u ON v.driver_id = u.id
                 WHERE v.is_active = true`;
    const params: any[] = [];

    if (filters.type) {
      params.push(filters.type);
      query += ` AND v.type = $${params.length}`;
    }

    query += ' ORDER BY v.plate_number';
    return this.dataSource.query(query, params);
  }

  async getVehicleById(tenantSchema: string, id: string) {
    const result = await this.dataSource.query(
      `SELECT v.*, u.name as driver_name
       FROM "${tenantSchema}".vehicles v
       LEFT JOIN "${tenantSchema}".users u ON v.driver_id = u.id
       WHERE v.id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Kendaraan tidak ditemukan');
    return result[0];
  }
}
