import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotificationsGatewayService } from './notifications-gateway.service';

@Controller('notifications')
export class NotificationsGatewayController {
  constructor(private readonly notificationsGatewayService: NotificationsGatewayService) {}

  @Get('health')
  async health(@Res() res: Response) {
    try {
      const result = await this.notificationsGatewayService.health();
      return res.status(200).json(result ?? { status: 'ok' });
    } catch {
      return res.status(502).json({ message: 'Notification service unavailable' });
    }
  }
}
