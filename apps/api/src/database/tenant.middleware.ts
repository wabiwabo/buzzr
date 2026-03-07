import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

declare global {
  namespace Express {
    interface Request {
      tenantSchema?: string;
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantSlug = req.headers['x-tenant-slug'] as string;

    if (!tenantSlug) {
      throw new BadRequestException('Missing X-Tenant-Slug header');
    }

    const result = await this.dataSource.query(
      'SELECT id, schema_name FROM public.tenants WHERE slug = $1 AND is_active = true',
      [tenantSlug],
    );

    if (!result.length) {
      throw new BadRequestException(`Tenant "${tenantSlug}" not found`);
    }

    const schemaName = result[0].schema_name;

    if (!/^[a-z_][a-z0-9_]*$/.test(schemaName)) {
      throw new BadRequestException('Invalid tenant schema name');
    }

    req.tenantId = result[0].id;
    req.tenantSchema = schemaName;

    await this.dataSource.query(`SET search_path TO '${schemaName}', public`);

    next();
  }
}
