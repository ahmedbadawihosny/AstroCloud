import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class NotificationsHealthController {
  @MessagePattern({ cmd: 'getNotificationsHealth' })
  getNotificationsHealth(): object {
    return {
      status: 'Healthy!',
      service: 'Notifications Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
