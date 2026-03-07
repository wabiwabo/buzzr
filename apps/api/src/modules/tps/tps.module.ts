import { Module } from '@nestjs/common';
import { TpsController } from './tps.controller';
import { TpsService } from './tps.service';

@Module({
  controllers: [TpsController],
  providers: [TpsService],
  exports: [TpsService],
})
export class TpsModule {}
