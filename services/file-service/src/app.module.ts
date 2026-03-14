import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsModule } from '@file-sharing-app/common';
import { FilesModule } from './files/files.module';
import { ShareModule } from './share/share.module';
import { FilesHealthController } from './health.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/file_db',
    ),
    NatsModule,
    FilesModule,
    ShareModule,
  ],
  controllers: [FilesHealthController],
})
export class AppModule {}
