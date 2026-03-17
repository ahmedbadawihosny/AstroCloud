import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FilesGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly natsClient: ClientProxy,
  ) { }

  upload(payload: { userId: string; file: unknown; metadata?: Record<string, unknown> }, authToken: string) {
    const natsPayload = { userId: payload.userId, file: payload.file, metadata: payload.metadata, authToken };
    return firstValueFrom(this.natsClient.send({ cmd: 'uploadFile' }, natsPayload));
  }

  list(authToken: string) {
    const natsPayload = { userId: 'extracted-from-token', authToken };
    return firstValueFrom(this.natsClient.send({ cmd: 'listFiles' }, natsPayload));
  }

  get(fileId: string, authToken: string) {
    const natsPayload = { fileId, userId: 'extracted-from-token', authToken };
    return firstValueFrom(this.natsClient.send({ cmd: 'getFile' }, natsPayload));
  }

  delete(fileId: string, authToken: string) {
    const natsPayload = { fileId, userId: 'extracted-from-token', authToken };
    return firstValueFrom(this.natsClient.send({ cmd: 'deleteFile' }, natsPayload));
  }

  share(fileId: string, payload: { expiresInSeconds: number }, authToken: string) {
    const natsPayload = { fileId, userId: 'extracted-from-token', expiresInSeconds: payload.expiresInSeconds, authToken };
    return firstValueFrom(this.natsClient.send({ cmd: 'createShare' }, natsPayload));
  }
}
