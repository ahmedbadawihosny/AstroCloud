import { connect, NatsConnection, StringCodec } from 'nats';

export type NatsConfig = { servers: string[] };

export class NatsClient {
  private nc!: NatsConnection;
  private sc = StringCodec();

  async connect(cfg: NatsConfig): Promise<void> {
    this.nc = await connect({ servers: cfg.servers });
  }

  async publish(subject: string, payload: unknown): Promise<void> {
    const data = this.sc.encode(JSON.stringify(payload));
    this.nc.publish(subject, data);
  }

  subscribe(
    subject: string,
    handler: (payload: unknown) => Promise<void> | void,
  ): void {
    const sub = this.nc.subscribe(subject);
    (async () => {
      for await (const m of sub) {
        const raw = this.sc.decode(m.data);
        try {
          await handler(JSON.parse(raw) as unknown);
        } catch (err) {
          console.error(`[NatsClient] handler error for ${subject}:`, err);
        }
      }
    })();
  }

  async close(): Promise<void> {
    if (this.nc) await this.nc.drain();
  }
}
