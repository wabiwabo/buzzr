import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly dataSource: DataSource) {}

  async createTenant(dto: CreateTenantDto) {
    const schemaName = dto.slug.replace(/-/g, '_');

    try {
      const result = await this.dataSource.query(
        `INSERT INTO public.tenants (name, slug, schema_name) VALUES ($1, $2, $3) RETURNING *`,
        [dto.name, dto.slug, schemaName],
      );

      await this.dataSource.query(`SELECT create_tenant_schema($1)`, [schemaName]);

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Tenant dengan slug ini sudah ada');
      }
      throw error;
    }
  }

  async listTenants() {
    return this.dataSource.query(
      'SELECT id, name, slug, is_active, created_at FROM public.tenants ORDER BY name',
    );
  }
}
