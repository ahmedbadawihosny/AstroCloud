const { connect, StringCodec } = require('nats');

class NatsClient {
  constructor() {
    this.sc = StringCodec();
  }

  async connect(cfg) {
    this.nc = await connect({ servers: cfg.servers });
  }

  async publish(subject, payload) {
    const data = this.sc.encode(JSON.stringify(payload));
    this.nc.publish(subject, data);
  }

  subscribe(subject, handler) {
    const sub = this.nc.subscribe(subject);
    (async () => {
      for await (const m of sub) {
        const raw = this.sc.decode(m.data);
        try {
          await handler(JSON.parse(raw));
        } catch (err) {
          console.error(`[NatsClient] handler error for ${subject}:`, err);
        }
      }
    })();
  }

  async close() {
    if (this.nc) await this.nc.drain();
  }
}

module.exports.NatsClient = NatsClient;
