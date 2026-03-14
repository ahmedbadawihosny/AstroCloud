import { Module } from '@nestjs/common';
import { NotificationsProxyController } from './notifications-proxy.controller';

@Module({
  controllers: [NotificationsProxyController],
})
export class NotificationsProxyModule {}
