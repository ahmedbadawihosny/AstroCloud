import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ShareGatewayService } from './share-gateway.service';

@Controller('share')
export class ShareGatewayController {
  constructor(private readonly shareGatewayService: ShareGatewayService) {}

  @Get(':token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const result = await this.shareGatewayService.download(token);
    if (result?.contentType) res.setHeader('Content-Type', result.contentType);
    if (result?.contentDisposition) res.setHeader('Content-Disposition', result.contentDisposition);
    if (result?.body) {
      const buf = Buffer.from(result.body, result.encoding || 'base64');
      return res.status(200).send(buf);
    }
    return res.status(200).json(result ?? { message: 'Download not found' });
  }
}
