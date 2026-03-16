import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilesService } from './files.service';
import {
  UploadFileDto,
  ListFilesDto,
  GetFileDto,
  DeleteFileDto,
  CreateShareDto,
} from './dto/file-requests.dto';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern({ cmd: 'uploadFile' })
  upload(@Payload() payload: UploadFileDto) {
    return this.filesService.upload(payload);
  }

  @MessagePattern({ cmd: 'listFiles' })
  list(@Payload() payload: ListFilesDto) {
    return this.filesService.list(payload.userId);
  }

  @MessagePattern({ cmd: 'getFile' })
  get(@Payload() payload: GetFileDto) {
    return this.filesService.get(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'deleteFile' })
  delete(@Payload() payload: DeleteFileDto) {
    return this.filesService.delete(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'createShare' })
  share(@Payload() payload: CreateShareDto) {
    return this.filesService.share(payload.fileId, payload.userId, payload.expiresInSeconds);
  }
}
