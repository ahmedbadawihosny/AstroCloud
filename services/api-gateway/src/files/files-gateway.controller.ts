import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FilesGatewayService } from './files-gateway.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('files')
@UseGuards(JwtGuard)
export class FilesGatewayController {
  constructor(private readonly filesGatewayService: FilesGatewayService) {}

  @Post('upload')
  async upload(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.upload({
      userId: String(userId),
      file: req.body?.file ?? req.file,
      metadata: req.body,
    });
    return res.status(200).json(result);
  }

  @Get()
  async list(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.list(String(userId));
    return res.status(200).json(result);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.get({ userId: String(userId), fileId: id });
    return res.status(200).json(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.delete({ userId: String(userId), fileId: id });
    return res.status(200).json(result);
  }

  @Post(':id/share')
  async share(
    @Param('id') id: string,
    @Body() body: { expiresInSeconds: number },
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.share({
      userId: String(userId),
      fileId: id,
      expiresInSeconds: body?.expiresInSeconds ?? 86400,
    });
    return res.status(200).json(result);
  }
}
