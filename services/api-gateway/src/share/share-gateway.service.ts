import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShareGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  download(token: string) {
    return firstValueFrom(this.client.send({ cmd: 'getShareDownload' }, { token }));
  }
}
