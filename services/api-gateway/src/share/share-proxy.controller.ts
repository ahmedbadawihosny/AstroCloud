import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('share')
export class ShareProxyController {
  @Get(':token')
  async download(@Req() req: Request, @Res() res: Response, @Param('token') token: string) {
    const base = process.env.FILE_SERVICE_URL || 'http://localhost:3002';
    const url = `${base}/share/${token}`;
    const axios = (await import('axios')).default;
    try {
      const { data, status, headers } = await axios.get(url, {
        responseType: 'stream',
        validateStatus: () => true,
        headers: req.headers as Record<string, string>,
      });
      if (headers['content-type']) res.setHeader('content-type', headers['content-type']);
      if (headers['content-disposition']) res.setHeader('content-disposition', headers['content-disposition']);
      res.status(status);
      if (typeof (data as { pipe: (r: Response) => void }).pipe === 'function') (data as { pipe: (r: Response) => void }).pipe(res);
      else res.json(data);
    } catch {
      res.status(502).json({ message: 'File service unavailable' });
    }
  }
}
