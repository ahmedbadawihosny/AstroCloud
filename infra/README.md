# Infrastructure notes

Supporting material for local and production setups. **Docker Compose** at the repo root already runs **Postgres**, **NATS**, **app**, **api-gateway**, and **nginx**; these folders document and extend that.

| Directory | Contents |
|-----------|----------|
| **[postgres/](postgres/)** | Second DB bootstrap (`init-databases.sql`), migration URLs, `DATABASE_URL_*` |
| **[nats/](nats/)** | Client URL (`NATS_URL`), monitoring port |
| **[minio/](minio/)** | Optional S3-compatible dev storage; env vars live in **`services/app/.env`** |

There is no MongoDB layout here; persistence is **PostgreSQL** + **TypeORM** in **`services/app`**.
