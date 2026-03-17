import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from '@file-sharing-app/common';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI_AUTH as string, {
      dbName: 'auth_db',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI_FILE_SHARING as string, {
      dbName: 'file_sharing_db',
    }),
    NatsModule,
    AuthModule,
    FilesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
