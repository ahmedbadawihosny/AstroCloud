import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ShareGatewayService } from './share-gateway.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Sharing')
@Controller('api/v1/share')
export class ShareGatewayController {
  constructor(private readonly shareGatewayService: ShareGatewayService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Download shared file by token',
    description:
      'Resolves a public share token to the underlying file and streams the file back to the client. Returns JSON when no file is found.',
  })
  @ApiParam({
    name: 'token',
    description: 'Public share token generated when sharing a file',
    example: 'sh_abc123xyz',
  })
  @ApiResponse({ status: 200, description: 'File download or JSON payload returned' })
  @ApiResponse({ status: 404, description: 'Share token not found' })
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
