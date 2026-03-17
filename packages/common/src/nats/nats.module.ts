import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import 'reflect-metadata';
import { NatsClient } from './nats.client';

function getServers(): string[] {
  const raw = process.env.NATS_URL || process.env.NATS_SERVERS || 'nats://localhost:4222';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

@Global()
@Module({
  providers: [
    {
      provide: NatsClient,
      useFactory: () => new NatsClient(),
    },
  ],
  exports: [NatsClient],
})
export class NatsModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly nats: NatsClient) { }

  async onModuleInit(): Promise<void> {
    await this.nats.connect({ servers: getServers() });
  }

  async onModuleDestroy(): Promise<void> {
    await this.nats.close();
  }
}
