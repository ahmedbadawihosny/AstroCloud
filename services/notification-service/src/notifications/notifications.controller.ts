import { Controller, Get } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@file-sharing-app/common';
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

  @EventPattern(EVENTS.USER_CREATED)
  handleUserCreated(@Payload() payload: Record<string, unknown>) {
    return this.notificationsService.handleUserCreated(payload);
  }

  @EventPattern(EVENTS.FILE_UPLOADED)
  handleFileUploaded(@Payload() payload: Record<string, unknown>) {
    return this.notificationsService.handleFileUploaded(payload);
  }

  @EventPattern(EVENTS.FILE_DELETED)
  handleFileDeleted(@Payload() payload: Record<string, unknown>) {
    return this.notificationsService.handleFileDeleted(payload);
  }

  @EventPattern(EVENTS.FILE_SHARED)
  handleFileShared(@Payload() payload: Record<string, unknown>) {
    return this.notificationsService.handleFileShared(payload);
  }
}