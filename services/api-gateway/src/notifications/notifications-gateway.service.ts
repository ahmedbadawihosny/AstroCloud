import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  health() {
    return firstValueFrom(this.client.send({ cmd: 'notifications.health' }, {}));
  }
}
