import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, AddStopDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Request } from 'express';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateScheduleDto, @Req() req: Request) {
    return this.scheduleService.createSchedule(req.tenantSchema!, dto);
  }

  @Post(':id/stops')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  addStop(@Param('id') id: string, @Body() dto: AddStopDto, @Req() req: Request) {
    return this.scheduleService.addStop(req.tenantSchema!, id, dto);
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
    return this.scheduleService.listSchedulesPaginated(req.tenantSchema!, query, filters);
  }

  @Get('today')
  @Roles(UserRole.DRIVER)
  getToday(@Req() req: any) {
    return this.scheduleService.getTodaySchedules(req.tenantSchema!, req.user.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.scheduleService.getScheduleById(req.tenantSchema!, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER, UserRole.DLH_ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.scheduleService.updateStatus(req.tenantSchema!, id, status);
  }
}
