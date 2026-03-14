import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { NatsClientModule } from './common/nats-client/nats-client.module';
import { AuthGatewayModule } from './auth/auth.module';
import { AccountGatewayModule } from './account/account.module';
import { FilesGatewayModule } from './files/files-gateway.module';
import { NotificationsGatewayModule } from './notifications/notifications-gateway.module';
import { ShareGatewayModule } from './share/share-gateway.module';
import { SwaggerService } from './common/services/swagger.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '15m' },
    }),
    NatsClientModule,
    AuthGatewayModule,
    AccountGatewayModule,
    FilesGatewayModule,
    NotificationsGatewayModule,
    ShareGatewayModule,
  ],
  controllers: [AppController],
  providers: [SwaggerService],
})
export class AppModule {}
