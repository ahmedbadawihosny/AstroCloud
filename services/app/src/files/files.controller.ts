import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilesService } from './files.service';
import {
  UploadFileNatsDto,
  ListFilesNatsDto,
  GetFileNatsDto,
  DeleteFileNatsDto,
  CreateShareNatsDto,
} from './dto/file-requests.dto';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  // NATS Message Patterns only - no HTTP endpoints
  @MessagePattern({ cmd: 'uploadFile' })
  upload(@Payload() payload: UploadFileNatsDto) {
    return this.filesService.upload(payload);
  }

  @MessagePattern({ cmd: 'listFiles' })
  list(@Payload() payload: ListFilesNatsDto) {
    return this.filesService.list(payload.userId);
  }

  @MessagePattern({ cmd: 'getFile' })
  get(@Payload() payload: GetFileNatsDto) {
    return this.filesService.get(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'deleteFile' })
  delete(@Payload() payload: DeleteFileNatsDto) {
    return this.filesService.delete(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'createShare' })
  share(@Payload() payload: CreateShareNatsDto) {
    return this.filesService.share(payload.fileId, payload.userId, payload.expiresInSeconds);
  }
}
