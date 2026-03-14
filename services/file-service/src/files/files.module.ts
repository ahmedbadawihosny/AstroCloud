import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema, File } from './file.schema';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageModule } from '../storage/storage.module';
import { ShareModule } from '../share/share.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    StorageModule,
    ShareModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
