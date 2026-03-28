import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from '@file-sharing-app/common';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import {
  UserEntity,
  AccountEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
  FileEntity,
  ShareLinkEntity,
} from './database/entities';
import { AUTH_DB, FILES_DB } from './database/typeorm-connections';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      name: AUTH_DB,
      type: 'postgres',
      url: process.env.DATABASE_URL_AUTH,
      entities: [
        UserEntity,
        AccountEntity,
        RefreshTokenEntity,
        EmailVerificationEntity,
        PasswordResetEntity,
      ],
      synchronize: false,
    }),
    TypeOrmModule.forRoot({
      name: FILES_DB,
      type: 'postgres',
      url: process.env.DATABASE_URL_FILE_SHARING,
      entities: [FileEntity, ShareLinkEntity],
      synchronize: false,
    }),
    NatsModule,
    AuthModule,
    FilesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
