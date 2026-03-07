import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { CreateCheckpointDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('checkpoint')
  @Roles(UserRole.DRIVER)
  createCheckpoint(@Body() dto: CreateCheckpointDto, @Req() req: Request) {
    return this.transferService.createCheckpoint(req.tenantSchema!, dto);
  }

  @Get('manifest/:scheduleId')
  getManifest(@Param('scheduleId') scheduleId: string, @Req() req: Request) {
    return this.transferService.getManifest(req.tenantSchema!, scheduleId);
  }

  @Patch('manifest/:scheduleId/verify')
  @Roles(UserRole.TPST_OPERATOR, UserRole.DLH_ADMIN)
  verifyManifest(@Param('scheduleId') scheduleId: string, @Req() req: any) {
    return this.transferService.verifyManifest(req.tenantSchema!, scheduleId, req.user.userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER, UserRole.DLH_ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.transferService.updateTransferStatus(req.tenantSchema!, id, status);
  }
}
