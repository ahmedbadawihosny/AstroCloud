import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema, File } from './file.schema';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageModule } from '../storage/storage.module';
import { ShareModule } from '../share/share.module';
import { NatsModule } from '@file-sharing-app/common';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    StorageModule,
    ShareModule,
    NatsModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
