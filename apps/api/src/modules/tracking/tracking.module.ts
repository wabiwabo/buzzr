import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService],
})
export class TrackingModule {}
