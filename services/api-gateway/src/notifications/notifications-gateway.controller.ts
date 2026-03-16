import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotificationsGatewayService } from './notifications-gateway.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsGatewayController {
  constructor(private readonly notificationsGatewayService: NotificationsGatewayService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Notifications service health check',
    description:
      'Proxy endpoint that checks the health of the notifications microservice and returns its status.',
  })
  @ApiResponse({ status: 200, description: 'Notifications service is healthy' })
  @ApiResponse({
    status: 502,
    description: 'Notifications service is unavailable or cannot be reached',
  })
  async health(@Res() res: Response) {
    try {
      const result = await this.notificationsGatewayService.health();
      return res.status(200).json(result ?? { status: 'ok' });
    } catch {
      return res.status(502).json({ message: 'Notification service unavailable' });
    }
  }
}
