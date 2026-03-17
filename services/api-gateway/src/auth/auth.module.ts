import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthGatewayService } from './auth.service';
import { AuthGatewayController } from './auth.controller';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';

@Module({
  imports: [HttpModule, NatsClientModule],
  controllers: [AuthGatewayController],
  providers: [AuthGatewayService],
  exports: [AuthGatewayService],
})
export class AuthGatewayModule { }
