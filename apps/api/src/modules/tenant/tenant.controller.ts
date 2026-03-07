import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  list() {
    return this.tenantService.listTenants();
  }
}
