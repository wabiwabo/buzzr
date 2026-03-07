import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':vehicleId/history')
  getHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: Request,
  ) {
    return this.trackingService.getHistory(req.tenantSchema!, vehicleId, from, to);
  }

  @Get(':vehicleId/latest')
  getLatest(@Param('vehicleId') vehicleId: string, @Req() req: Request) {
    return this.trackingService.getLatestPosition(req.tenantSchema!, vehicleId);
  }
}
