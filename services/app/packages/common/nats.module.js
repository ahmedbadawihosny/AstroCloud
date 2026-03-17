const { Global, Module } = require('@nestjs/common');
const { NatsClient } = require('./nats.client');

function getServers() {
  const raw = process.env.NATS_URL || process.env.NATS_SERVERS || 'nats://localhost:4222';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

class NatsModule {
  constructor(nats) {
    this.nats = nats;
  }

  async onModuleInit() {
    await this.nats.connect({ servers: getServers() });
  }

  async onModuleDestroy() {
    await this.nats.close();
  }
}

Global()(Module({
  providers: [
    {
      provide: NatsClient,
      useFactory: () => new NatsClient(),
    },
  ],
  exports: [NatsClient],
})(NatsModule));

module.exports.NatsModule = NatsModule;
