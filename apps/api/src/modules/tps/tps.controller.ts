import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TpsService } from './tps.service';
import { CreateTpsDto } from './dto/create-tps.dto';
import { RecordWasteDto } from './dto/record-waste.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('tps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TpsController {
  constructor(private readonly tpsService: TpsService) {}

  @Post()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTpsDto, @Req() req: Request) {
    return this.tpsService.createTps(req.tenantSchema!, dto);
  }

  @Post('waste')
  @Roles(UserRole.TPS_OPERATOR, UserRole.SWEEPER, UserRole.DLH_ADMIN)
  recordWaste(@Body() dto: RecordWasteDto, @Req() req: Request) {
    return this.tpsService.recordWaste(req.tenantSchema!, dto);
  }

  @Get('paginated')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  listPaginated(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
    @Query('filters') filtersStr?: string,
  ) {
    let filters: Record<string, string> | undefined;
    if (filtersStr) {
      try { filters = JSON.parse(filtersStr); } catch { /* ignore */ }
    }
    return this.tpsService.listTpsPaginated(req.tenantSchema!, query, filters);
  }

  @Get()
  list(@Req() req: Request, @Query('areaId') areaId?: string, @Query('type') type?: string, @Query('status') status?: string) {
    return this.tpsService.listTps(req.tenantSchema!, { areaId, type, status });
  }

  @Get('nearby')
  findNearby(@Req() req: Request, @Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius?: string) {
    return this.tpsService.findNearby(req.tenantSchema!, parseFloat(lat), parseFloat(lng), radius ? parseInt(radius) : 1000);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.tpsService.getTpsById(req.tenantSchema!, id);
  }
}
