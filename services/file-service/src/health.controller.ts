import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class FilesHealthController {
  @MessagePattern({ cmd: 'getFilesHealth' })
  getFilesHealth(): object {
    return {
      status: 'Healthy!',
      service: 'Files Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
