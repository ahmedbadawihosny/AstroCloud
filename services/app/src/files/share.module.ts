import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareService } from './share.service';
import { File, FileSchema } from './file.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }])],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
