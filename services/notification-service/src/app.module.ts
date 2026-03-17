import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { AppController } from './app.controller';

@Module({
  controllers: [NotificationsController, AppController],
  providers: [NotificationsService],
})
export class AppModule {}
