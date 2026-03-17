import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NatsModule } from '@file-sharing-app/common';
import { FilesModule } from './files/files.module';
import { ShareModule } from './share/share.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGODB_URI') ||
          configService.get<string>('DATABASE.MONGODB_URI') ||
          process.env.MONGODB_URI;

        if (!uri && process.env.NODE_ENV !== 'test') {
          throw new Error('MONGODB_URI is required for file-service');
        }

        return {
          uri: uri as string,
        };
      },
    }),
    NatsModule,
    FilesModule,
    ShareModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
