import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareService } from './share.service';
import { FileEntity, ShareLinkEntity } from '../database/entities';
import { FILES_DB } from '../database/typeorm-connections';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, ShareLinkEntity], FILES_DB)],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
