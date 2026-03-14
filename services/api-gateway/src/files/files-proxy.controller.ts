import { Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('files')
export class FilesProxyController {
  // POST /files/upload, GET /files, GET /files/:id, DELETE /files/:id, POST /files/:id/share → file-service
  private base() {
    return process.env.FILE_SERVICE_URL || 'http://localhost:3002';
  }

  @Post('upload')
  upload(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, 'upload', 'POST');
  }

  @Get()
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, '', 'GET');
  }

  @Get(':id')
  get(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    return this.proxy(req, res, id, 'GET');
  }

  @Delete(':id')
  delete(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    return this.proxy(req, res, id, 'DELETE');
  }

  @Post(':id/share')
  share(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    return this.proxy(req, res, `${id}/share`, 'POST');
  }

  private async proxy(req: Request, res: Response, path: string, method: string) {
    const base = this.base();
    const url = path ? `${base}/files/${path}` : `${base}/files`;
    const { default: axios } = await import('axios');
    try {
      const { data, status, headers: h } = await axios({
        method,
        url,
        data: req.body,
        params: req.query,
        headers: req.headers as Record<string, string>,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });
      if (h['content-type']) res.setHeader('content-type', h['content-type']);
      res.status(status).json(data);
    } catch (e: unknown) {
      res.status(502).json({ message: 'File service unavailable' });
    }
  }
}
