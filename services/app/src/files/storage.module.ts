import { Module } from '@nestjs/common';
import { StorageService, S3StorageService } from './storage.service';

@Module({
  providers: [StorageService, S3StorageService],
  exports: [StorageService],
})
export class StorageModule {}
