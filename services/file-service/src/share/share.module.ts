import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareLink, ShareLinkSchema } from './share-link.schema';
import { File, FileSchema } from '../files/file.schema';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { StorageModule } from '../storage/storage.module';
import { NatsModule } from '@file-sharing-app/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShareLink.name, schema: ShareLinkSchema },
      { name: File.name, schema: FileSchema },
    ]),
    StorageModule,
    NatsModule,
  ],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
