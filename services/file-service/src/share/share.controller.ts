import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShareService } from './share.service';

@Controller()
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @MessagePattern({ cmd: 'getShareDownload' })
  download(@Payload() payload: { token: string }) {
    return this.shareService.download(payload.token);
  }
}
