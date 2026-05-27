import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { PASSWORD_ROLES } from '@buzzr/shared-types';
import * as bcrypt from 'bcrypt';
import { buildPaginatedQuery } from '../../common/utils/query-builder.util';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

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

  async listUsersPaginated(
    tenantSchema: string,
    query: PaginationQueryDto,
    filters?: Record<string, string>,
  ): Promise<PaginatedResponse<any>> {
    return buildPaginatedQuery(this.dataSource, {
      baseQuery: `SELECT u.id, u.name, u.email, u.phone, u.role, u.area_id, u.is_active, u.created_at, a.name as area_name FROM "${tenantSchema}".users u LEFT JOIN "${tenantSchema}".areas a ON u.area_id = a.id`,
      countQuery: `SELECT COUNT(*) FROM "${tenantSchema}".users u`,
      baseConditions: ['u.is_active = $1'],
      baseParams: [true],
      searchableColumns: ['u.name', 'u.email', 'u.phone'],
      sortableColumns: ['u.name', 'u.email', 'u.role', 'u.created_at'],
      filterableColumns: ['u.role', 'u.area_id'],
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

  async setPushToken(tenantSchema: string, userId: string, token: string | null) {
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".users SET expo_push_token = $1, updated_at = NOW() WHERE id = $2`,
      [token, userId],
    );
    return { ok: true };
  }

  async getPushToken(tenantSchema: string, userId: string): Promise<string | null> {
    const result = await this.dataSource.query(
      `SELECT expo_push_token FROM "${tenantSchema}".users WHERE id = $1`,
      [userId],
    );
    return result[0]?.expo_push_token || null;
  }
}
