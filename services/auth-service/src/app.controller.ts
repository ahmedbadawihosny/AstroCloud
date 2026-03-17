import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'getAuthHealth' })
  getAuthHealth(): object {
    return {
      status: 'Healthy!',
      service: 'Auth Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}