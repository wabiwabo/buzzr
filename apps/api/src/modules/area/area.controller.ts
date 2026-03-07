import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';

@Controller('areas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateAreaDto, @Req() req: Request) {
    return this.areaService.createArea(req.tenantSchema!, dto);
  }

  @Get()
  list(@Req() req: Request, @Query('parentId') parentId?: string, @Query('level') level?: string) {
    return this.areaService.listAreas(req.tenantSchema!, { parentId, level });
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.areaService.getAreaById(req.tenantSchema!, id);
  }

  @Get(':id/children')
  getChildren(@Param('id') id: string, @Req() req: Request) {
    return this.areaService.getChildren(req.tenantSchema!, id);
  }
}
