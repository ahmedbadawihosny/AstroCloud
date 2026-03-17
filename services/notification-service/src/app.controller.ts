import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
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
