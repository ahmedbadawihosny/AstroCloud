import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsHealthController } from './health.controller';

@Module({
  controllers: [NotificationsController, NotificationsHealthController],
  providers: [NotificationsService],
})
export class AppModule {}
