import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAreaDto } from './dto/create-area.dto';

@Injectable()
export class AreaService {
  constructor(private readonly dataSource: DataSource) {}

  async createArea(tenantSchema: string, dto: CreateAreaDto) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".areas (name, level, parent_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, level, parent_id, created_at`,
      [dto.name, dto.level, dto.parentId || null],
    );
    return result[0];
  }

  async listAreas(tenantSchema: string, filters: { parentId?: string; level?: string }) {
    let query = `SELECT id, name, level, parent_id, created_at FROM "${tenantSchema}".areas WHERE 1=1`;
    const params: any[] = [];

    if (filters.parentId) {
      params.push(filters.parentId);
      query += ` AND parent_id = $${params.length}`;
    } else {
      query += ' AND parent_id IS NULL';
    }

    if (filters.level) {
      params.push(filters.level);
      query += ` AND level = $${params.length}`;
    }

    query += ' ORDER BY name';
    return this.dataSource.query(query, params);
  }

  async getAreaById(tenantSchema: string, id: string) {
    const result = await this.dataSource.query(
      `SELECT id, name, level, parent_id, created_at FROM "${tenantSchema}".areas WHERE id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Area tidak ditemukan');
    return result[0];
  }

  async getChildren(tenantSchema: string, parentId: string) {
    return this.dataSource.query(
      `SELECT id, name, level, parent_id, created_at FROM "${tenantSchema}".areas WHERE parent_id = $1 ORDER BY name`,
      [parentId],
    );
  }
}
