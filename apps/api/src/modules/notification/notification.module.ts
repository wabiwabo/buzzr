import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { ExpoPushService } from './expo-push.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, ExpoPushService],
  exports: [NotificationService],
})
export class NotificationModule {}
