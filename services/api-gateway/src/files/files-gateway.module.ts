import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { NatsClientModule } from '../common/nats-client/nats-client.module';
import { JwtGuard } from '../common/guards/jwt.guard';
import { FilesGatewayController } from './files-gateway.controller';
import { FilesGatewayService } from './files-gateway.service';

@Module({
  imports: [
    HttpModule,
    NatsClientModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [FilesGatewayController],
  providers: [FilesGatewayService, JwtGuard],
})
export class FilesGatewayModule { }
