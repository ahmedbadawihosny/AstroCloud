# File Sharing App

Monorepo: React frontend, NestJS API Gateway, Auth Service, File Service, Notification Service. Synchronous HTTP for user-facing commands; async NATS events for side effects (notifications, audit logs).

## System Architecture

```
React Web App (HTTPS)
    → API Gateway (NestJS)  [HTTP for clients]
        → NATS (message patterns) → Auth Service (NestJS)     → MongoDB (users)
        → NATS (message patterns) → File Service (NestJS)    → MongoDB (files, share_links) → S3 / MinIO
        → NATS (message patterns) → Notification Service    → health, future: emails/webhooks
        → NATS pub/sub for events (user_created, file_uploaded, file_deleted, file_shared)
```

- **API Gateway** exposes HTTP to the frontend and forwards all backend calls via **NATS** (no HTTP to services).
- **Backend services** (auth, file, notification) expose **message patterns** only; gateway uses a NATS client to call them.
- **File storage** is **S3 only** (AWS S3 or MinIO), configured via `FILE_S3_*` in `.env`.
- **Async NATS events** used for side effects (notifications, audit, analytics).

## Folder Structure

```
file-sharing-app/
  docker/
    nginx/                 # optional reverse proxy
  infra/
    nats/                  # NATS notes
    mongodb/               # MongoDB notes
    minio/                 # MinIO (S3-compatible) notes
  packages/
    common/                # shared: event contracts, NATS client, auth utils, DTOs, filters, interceptors
      src/
        nats/
        auth/
        dto/
        filters/
        interceptors/
        utils/
  services/
    api-gateway/           # NestJS: HTTP API + NATS client → auth, file, account, notification; rate limiting
    auth-service/          # NestJS: MessagePattern handlers; MongoDB (auth_db)
    file-service/          # NestJS: MessagePattern handlers; MongoDB (file_db); S3 storage only
    notification-service/  # NestJS: MessagePattern (health); subscribes to NATS events for notifications
  frontend/                # React (Vite), src/api, pages, components, hooks
  docker-compose.yml
  .env / .env.example
  README.md
```

`packages/common` is consumed by all Nest services via pnpm workspaces.

## Design Decisions

- **Auth**: JWT access token (short TTL); optional refresh token. Passwords hashed with bcrypt.
- **File storage**: **S3 only** (AWS S3 or MinIO). Configure via `.env`: `FILE_S3_ENDPOINT`, `FILE_S3_BUCKET`, `FILE_S3_ACCESS_KEY`, `FILE_S3_SECRET_KEY` (leave endpoint empty for AWS S3).
- **Share links**: signed random token stored **hashed** in DB + expiry. Download via message pattern; gateway streams response.
- **Security**: All file access via File Service; storage is private (no public buckets).
- **Gateway ↔ services**: NATS message patterns only; no HTTP calls from gateway to backend services.
- **Rate limiting**: API Gateway throttler per route.

## API Endpoints (Gateway)

All of these are served by the API Gateway over HTTP; the gateway forwards to the corresponding service via **NATS** (message patterns).

| Method | Path | Backend (NATS) | Auth |
|--------|------|----------------|------|
| POST   | /api/v1/auth/register | auth-service | no |
| POST   | /api/v1/auth/login     | auth-service | no |
| GET    | /api/v1/auth/current-user | auth-service | cookie |
| GET    | /api/v1/account/user/:userId | auth-service (account) | JWT |
| PUT    | /api/v1/account/user/:userId | auth-service (account) | JWT |
| POST   | /files/upload   | file-service | JWT |
| GET    | /files          | file-service | JWT |
| GET    | /files/:id      | file-service | JWT |
| DELETE | /files/:id      | file-service | JWT |
| POST   | /files/:id/share| file-service | JWT |
| GET    | /share/:token   | file-service | no (token in URL) |
| GET    | /notifications/health | notification-service | no |

## NATS Events

| Event | Producer | Payload |
|-------|----------|---------|
| user_created | auth-service (on register) | `{ userId, email, createdAt }` |
| file_uploaded | file-service (after store) | `{ fileId, userId, filename, size, mimeType, createdAt }` |
| file_deleted | file-service (after delete) | `{ fileId, userId, deletedAt }` |
| file_shared | file-service (share token created) | `{ fileId, userId, shareId, expiresAt }` |

Notification-service subscribes to all; handles idempotently (e.g. store processed eventId).

## Database Schema (MongoDB)

**auth_db (auth-service)**  
- **users**: `_id`, `email` (unique), `passwordHash`, `name`, `createdAt`, `updatedAt`

**file_db (file-service)**  
- **files**: `_id`, `userId`, `originalName`, `storageKey` (unique), `size`, `mimeType`, `checksumSha256?`, `createdAt`, `deletedAt?`  
- **share_links**: `_id`, `fileId`, `userId`, `tokenHash`, `expiresAt`, `createdAt`  
  - TTL index on `expiresAt` with `expireAfterSeconds: 0` for auto-cleanup.

## Environment (S3)

File storage is **S3 only**. In `.env`:

| Variable | Description |
|----------|-------------|
| `FILE_S3_ENDPOINT` | S3 endpoint (e.g. `http://minio:9000` for MinIO). Leave empty for AWS S3. |
| `FILE_S3_REGION` | Region (default `us-east-1`). |
| `FILE_S3_BUCKET` | Bucket name. |
| `FILE_S3_ACCESS_KEY` | Access key. |
| `FILE_S3_SECRET_KEY` | Secret key. |
| `FILE_S3_FORCE_PATH_STYLE` | Set `true` for MinIO. |

## Setup

1. **Prerequisites**:
   - Node 18+, pnpm
   - **MongoDB** running locally (`mongodb://localhost:27017`) or set `MONGODB_URI` (or `MONGO_URI`) in each service’s `.env` (auth-service, file-service)
   - **NATS** running (e.g. `nats://localhost:4222`) — required for gateway ↔ services
   - Docker optional (for infra and full stack)

2. **Install dependencies** (from repo root):
   ```bash
   pnpm install
   ```

3. **Environment**: Copy `.env.example` to `.env`. Set `AUTH_JWT_SECRET` and the `FILE_S3_*` variables above for file storage.

4. **Run infrastructure only**:
   ```bash
   docker-compose up -d nats mongodb-auth mongodb-file minio
   ```

5. **Run services locally** (separate terminals or use root `pnpm run dev`):
   ```bash
   pnpm run dev:gateway       # API at :3000 — ensure no other process uses port 3000
   pnpm run dev:auth          # needs MongoDB
   pnpm run dev:file          # needs MongoDB
   pnpm run dev:notification  # NATS only
   pnpm run dev:frontend      # :5173
   ```
   **Troubleshooting**: If you see `ECONNREFUSED ::1:27017`, start MongoDB or set `MONGODB_URI` in `services/auth-service/.env` and `services/file-service/.env`. If you see `EADDRINUSE :::3000`, stop any process already using port 3000.

6. **Run everything with Docker**:
   ```bash
   docker-compose up --build
   ```
   Gateway: http://localhost:3000; frontend dev server can proxy to it.

## Scripts (root)

- `pnpm run build` — build all packages and services
- `pnpm run dev` — run all services in parallel (if configured)
- `pnpm run dev:gateway` / `dev:auth` / `dev:file` / `dev:notification` / `dev:frontend` — run a single app
