import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern({ cmd: 'uploadFile' })
  upload(@Payload() payload: { userId: string; file: unknown; metadata?: Record<string, unknown> }) {
    return this.filesService.upload(payload);
  }

  @MessagePattern({ cmd: 'listFiles' })
  list(@Payload() payload: { userId: string }) {
    return this.filesService.list(payload.userId);
  }

  @MessagePattern({ cmd: 'getFile' })
  get(@Payload() payload: { userId: string; fileId: string }) {
    return this.filesService.get(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'deleteFile' })
  delete(@Payload() payload: { userId: string; fileId: string }) {
    return this.filesService.delete(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'createShare' })
  share(@Payload() payload: { userId: string; fileId: string; expiresInSeconds: number }) {
    return this.filesService.share(payload.fileId, payload.userId, payload.expiresInSeconds);
  }
}
