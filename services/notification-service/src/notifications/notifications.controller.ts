import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern({ cmd: 'notifications.health' })
  healthNats(@Payload() _payload: Record<string, unknown>) {
    return this.notificationsService.health();
  }

  @Get('health')
  healthHttp() {
    return this.notificationsService.health();
  }
}