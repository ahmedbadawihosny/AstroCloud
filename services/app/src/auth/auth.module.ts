/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountModule } from './account/account.module';
import { NotificationModule } from './notification/notification.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import configuration from './common/config/configuration';
import {
  UserEntity,
  AccountEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
} from '../database/entities';
import { AUTH_DB } from '../database/typeorm-connections';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forFeature(
      [
        UserEntity,
        AccountEntity,
        RefreshTokenEntity,
        EmailVerificationEntity,
        PasswordResetEntity,
      ],
      AUTH_DB,
    ),
    JwtModule.register({
      secret:
        configuration().JWT.JWT_ACCESS_SECRET ||
        'fallback-secret-key',
      signOptions: {
        expiresIn:
          (configuration().JWT.JWT_ACCESS_EXPIRES_IN as string) || '1h',
      },
    }),
    PassportModule,
    AccountModule,
    NotificationModule,
    WaitlistModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
