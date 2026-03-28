import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../database/entities';
import { FILES_DB } from '../database/typeorm-connections';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageModule } from './storage.module';
import { ShareModule } from './share.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity], FILES_DB),
    StorageModule,
    ShareModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
