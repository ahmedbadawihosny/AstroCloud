import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FilesGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  upload(payload: { userId: string; file: unknown; metadata?: Record<string, unknown> }) {
    return firstValueFrom(this.client.send({ cmd: 'uploadFile' }, payload));
  }

  list(userId: string) {
    return firstValueFrom(this.client.send({ cmd: 'listFiles' }, { userId }));
  }

  get(payload: { userId: string; fileId: string }) {
    return firstValueFrom(this.client.send({ cmd: 'getFile' }, payload));
  }

  delete(payload: { userId: string; fileId: string }) {
    return firstValueFrom(this.client.send({ cmd: 'deleteFile' }, payload));
  }

  share(payload: { userId: string; fileId: string; expiresInSeconds: number }) {
    return firstValueFrom(this.client.send({ cmd: 'createShare' }, payload));
  }
}
