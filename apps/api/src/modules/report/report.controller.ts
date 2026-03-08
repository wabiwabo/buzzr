import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('waste-volume')
  getWasteVolume(@Req() req: Request, @Query('from') from: string, @Query('to') to: string) {
    return this.reportService.getWasteVolumeReport(req.tenantSchema!, from, to);
  }

  @Get('complaints')
  getComplaintStats(@Req() req: Request, @Query('from') from: string, @Query('to') to: string) {
    return this.reportService.getComplaintStats(req.tenantSchema!, from, to);
  }

  @Get('heatmap')
  getHeatmap(@Req() req: Request) {
    return this.reportService.getWasteHeatmap(req.tenantSchema!);
  }

  @Get('driver-performance')
  getDriverPerformance(@Req() req: Request, @Query('from') from: string, @Query('to') to: string) {
    return this.reportService.getDriverPerformance(req.tenantSchema!, from, to);
  }

  @Get('activity-feed')
  getActivityFeed(@Req() req: Request, @Query('limit') limit?: string) {
    return this.reportService.getActivityFeed(req.tenantSchema!, Number(limit) || 20);
  }

  @Get('dashboard')
  getDashboardWithComparison(@Req() req: Request, @Query('compare') compare?: string) {
    if (compare === 'prev_week') {
      return this.reportService.getDashboardWithComparison(req.tenantSchema!);
    }
    return this.reportService.getDashboardSummary(req.tenantSchema!);
  }
}
