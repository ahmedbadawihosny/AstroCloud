# Docker-related assets

| Path | Role |
|------|------|
| `nginx/nginx.conf` | Reverse proxy for `docker-compose` (`/api/*`, `/api-docs`, large uploads). |

Compose still builds **`services/*/Dockerfile`** from the repo root; this folder only holds **configuration** consumed by volumes (not separate app images).

For database init scripts see **`../infra/postgres/`**.
