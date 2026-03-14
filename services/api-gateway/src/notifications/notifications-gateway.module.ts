import { Module } from '@nestjs/common';
import { NatsClientModule } from '../common/nats-client/nats-client.module';
import { NotificationsGatewayController } from './notifications-gateway.controller';
import { NotificationsGatewayService } from './notifications-gateway.service';

@Module({
  imports: [NatsClientModule],
  controllers: [NotificationsGatewayController],
  providers: [NotificationsGatewayService],
})
export class NotificationsGatewayModule {}
