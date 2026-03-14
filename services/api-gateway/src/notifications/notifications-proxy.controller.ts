import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('notifications')
export class NotificationsProxyController {
  @Get('health')
  async health(@Req() req: Request, @Res() res: Response) {
    const base = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    const axios = (await import('axios')).default;
    try {
      const { data, status } = await axios.get(`${base}/notifications/health`, { validateStatus: () => true });
      return res.status(status).json(data);
    } catch {
      return res.status(502).json({ message: 'Notification service unavailable' });
    }
  }
}
