# NATS

The **API gateway** and **app service** talk over NATS (request–reply and pub/sub). Shared subjects and helpers live in **`packages/common`** (`EVENTS`, `NatsModule`, `NatsClient`).

### Local / Compose

- Default URL: **`NATS_URL=nats://localhost:4222`**
- Root **`docker-compose.yml`** runs NATS with **`-m 8222`** so the monitoring endpoint is **http://localhost:8222** (e.g. **`/healthz`** for health checks).

### Optional JetStream

The bundled Compose file does **not** enable JetStream. To experiment, adjust the NATS `command` in **`docker-compose.yml`** (see [NATS docs](https://docs.nats.io/running-a-nats-service/configuration)).
