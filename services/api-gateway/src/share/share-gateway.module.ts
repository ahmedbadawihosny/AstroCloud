import { Module } from '@nestjs/common';
import { NatsClientModule } from '../common/nats-client/nats-client.module';
import { ShareGatewayController } from './share-gateway.controller';
import { ShareGatewayService } from './share-gateway.service';

@Module({
  imports: [NatsClientModule],
  controllers: [ShareGatewayController],
  providers: [ShareGatewayService],
})
export class ShareGatewayModule {}
