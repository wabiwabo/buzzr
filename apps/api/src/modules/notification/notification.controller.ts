import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { SendPushDto } from './dto/send-push.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('push')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  sendPush(@Body() dto: SendPushDto, @Req() req: any) {
    return this.notificationService.sendPushToDriver(req.tenantSchema, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.notificationService.listNotifications(req.tenantSchema, req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.tenantSchema, req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markAsRead(req.tenantSchema, id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.tenantSchema, req.user.userId);
  }
}
