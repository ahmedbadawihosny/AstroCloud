import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShareService } from './share.service';
import { GetShareDownloadDto } from './dto/share-requests.dto';

@Controller()
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @MessagePattern({ cmd: 'getShareDownload' })
  download(@Payload() payload: GetShareDownloadDto) {
    return this.shareService.download(payload.token);
  }
}
