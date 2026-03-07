import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { PASSWORD_ROLES } from '@buzzr/shared-types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  async createUser(tenantSchema: string, dto: CreateUserDto) {
    let passwordHash: string | null = null;

    if (PASSWORD_ROLES.includes(dto.role as any) && dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".users (name, email, phone, password_hash, role, area_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, area_id, is_active, reward_points, created_at`,
      [dto.name, dto.email || null, dto.phone || null, passwordHash, dto.role, dto.areaId || null],
    );

    return result[0];
  }

  async listUsers(tenantSchema: string, filters?: { role?: string; areaId?: string }) {
    let query = `SELECT id, name, email, phone, role, area_id, is_active, created_at FROM "${tenantSchema}".users WHERE is_active = true`;
    const params: any[] = [];

    if (filters?.role) {
      params.push(filters.role);
      query += ` AND role = $${params.length}`;
    }

    if (filters?.areaId) {
      params.push(filters.areaId);
      query += ` AND area_id = $${params.length}`;
    }

    query += ' ORDER BY name';

    return this.dataSource.query(query, params);
  }

  async getUserById(tenantSchema: string, userId: string) {
    const result = await this.dataSource.query(
      `SELECT id, name, email, phone, role, area_id, is_active, reward_points, created_at
       FROM "${tenantSchema}".users WHERE id = $1`,
      [userId],
    );

    if (!result.length) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return result[0];
  }
}
