import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RewardService } from './reward.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get('config')
  getConfig() {
    return this.rewardService.getPointsConfig();
  }

  @Get('points')
  getMyPoints(@Req() req: any) {
    return this.rewardService.getUserPoints(req.tenantSchema, req.user.userId);
  }

  @Post('redeem')
  redeem(@Body() body: { points: number }, @Req() req: any) {
    return this.rewardService.redeemPoints(req.tenantSchema, req.user.userId, body.points);
  }
}
