import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';

@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateVehicleDto, @Req() req: Request) {
    return this.fleetService.createVehicle(req.tenantSchema!, dto);
  }

  @Get()
  list(@Req() req: Request, @Query('type') type?: string) {
    return this.fleetService.listVehicles(req.tenantSchema!, { type });
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.fleetService.getVehicleById(req.tenantSchema!, id);
  }

  @Patch(':id/assign')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  assignDriver(@Param('id') id: string, @Body('driverId') driverId: string, @Req() req: Request) {
    return this.fleetService.assignDriver(req.tenantSchema!, id, driverId);
  }

  @Patch(':id/unassign')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  unassignDriver(@Param('id') id: string, @Req() req: Request) {
    return this.fleetService.unassignDriver(req.tenantSchema!, id);
  }
}
