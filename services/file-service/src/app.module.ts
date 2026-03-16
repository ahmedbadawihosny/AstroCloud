import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from '@file-sharing-app/common';
import { FilesModule } from './files/files.module';
import { ShareModule } from './share/share.module';
import { FilesHealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    NatsModule,
    FilesModule,
    ShareModule,
  ],
  controllers: [FilesHealthController],
})
export class AppModule { }
