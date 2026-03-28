# File Sharing Platform

A cross-platform file sharing application for **web and mobile**. Built with a React SPA, React Native (Expo) mobile app, NestJS API Gateway, and a single NestJS **app service** (auth, files, and notifications as modules). Synchronous HTTP for clients; **NATS** request–reply for gateway → backend; NATS pub/sub for side effects (notifications, audit-style hooks).

## System Architecture

```
React Web App (HTTPS)          React Native + Expo (iOS / Android)
         └────────────────┬────────────────────┘
                          ▼
               API Gateway (NestJS)
               [HTTP · Rate limiting · JWT guard · Swagger UI]
                          │
                     NATS (message patterns)
                          │
                    App Service (NestJS)
                    ├── Auth module   → PostgreSQL (users)
                    ├── Files module  → PostgreSQL (files, share_links) + S3
                    └── Notifications module
                          │
                     NATS pub/sub
                     user_created · file_uploaded · file_deleted · file_shared
```

- **API Gateway** exposes HTTP to clients and calls the **app service** exclusively via **NATS** (no direct HTTP to the backend process).
- **App service** registers **message pattern** handlers for auth, files, and notifications.
- **File storage** is **S3-compatible** (AWS S3 or MinIO). File uploads use `FILE_S3_*` env vars. Profile pictures use `AWS_S3_*` (see Environment).
- **Mobile app** is a React Native (Expo) application sharing the same API; it adds biometric auth, native file/camera picker, push notifications, and the OS share sheet.

## Folder Structure

```
file-sharing-app/
  docker/
    nginx/                 # optional reverse proxy
  infra/
    README.md              # index: postgres, nats, minio
    nats/                  # NATS notes
    postgres/              # init SQL, migrations, DATABASE_URL_*
    minio/                 # optional local S3-compatible storage
  packages/
    common/                # shared workspace: NATS module/client, EVENTS (see packages/common/README.md)
      src/
        nats/
        auth/
        dto/
        filters/
        interceptors/
        utils/
  services/
    api-gateway/           # NestJS: HTTP API + NATS client; rate limiting; Swagger
    app/                   # NestJS microservice: auth + files + notifications
  frontend/                # React + Vite SPA (src/api, pages, components, hooks)
  mobile/                  # React Native + Expo (Expo Router, SecureStore, Notifications)
  docker-compose.yml
  README.md
```

`packages/common` is consumed by the gateway and app service via pnpm workspaces.

## Design Decisions

- **Auth**: JWT access token with httpOnly refresh token cookie; email verification on register; OTP-based password reset. Passwords hashed with bcrypt.
- **File storage**: Private S3 bucket; short-lived pre-signed URLs for all downloads.
- **Share links**: Opaque token returned once, stored **hashed** in PostgreSQL with an `expiresAt` column; a scheduled job or app-level check auto-expires stale rows. Public download resolves to a short-lived pre-signed S3 URL.
- **Gateway ↔ backend**: NATS message patterns only — no direct HTTP between services.
- **Rate limiting**: NestJS Throttler on the API Gateway.
- **API docs**: Swagger UI at `/api-docs` on the gateway (optional HTTP basic auth via `SWAGGER_USER` / `SWAGGER_PASSWORD`).
- **Database**: PostgreSQL via TypeORM. Two logical schemas/databases: one for auth, one for files and share links.
- **Mobile**: React Native (Expo) sharing the same backend. Token storage via Expo SecureStore; biometric unlock via Expo LocalAuthentication.

## API Endpoints (Gateway)

Base path prefix: **`/api/v1`**. All routes proxy to the app service over **NATS**.

| Method | Path | Auth |
|--------|------|------|
| GET | /api/v1 | no (gateway status) |
| GET | /api/v1/auth/health | no |
| GET | /api/v1/file/health | no |
| GET | /api/v1/notification/health | no |
| POST | /api/v1/auth/register | no |
| POST | /api/v1/auth/verify-email | no |
| POST | /api/v1/auth/login | no |
| POST | /api/v1/auth/refresh-token | cookie / body |
| GET | /api/v1/auth/current-user | cookie |
| POST | /api/v1/auth/request-reset-password | no |
| POST | /api/v1/auth/verify-reset-code | no |
| POST | /api/v1/auth/reset-password | no |
| POST | /api/v1/auth/upload-profile-picture | JWT |
| POST | /api/v1/auth/logout | JWT |
| GET | /api/v1/account/user/:userId | JWT |
| PUT | /api/v1/account/user/:userId | JWT |
| POST | /api/v1/files/upload | JWT |
| GET | /api/v1/files | JWT |
| GET | /api/v1/files/:id | JWT |
| DELETE | /api/v1/files/:id | JWT |
| POST | /api/v1/files/:id/share | JWT |
| GET | /api/v1/share/:token | no (token in URL) |
| GET | /api/v1/notifications/health | no |

For full request/response shapes use **http://localhost:4000/api-docs** when the gateway is running.

## NATS Events

| Event | Producer | Payload (conceptual) |
|-------|----------|----------------------|
| `user_created` | auth module (on register) | `{ userId, email, createdAt }` |
| `file_uploaded` | files module (after S3 store) | `{ fileId, userId, filename, size, mimeType, createdAt }` |
| `file_deleted` | files module (after soft-delete) | `{ fileId, userId, deletedAt }` |
| `file_shared` | files module (on share token create) | `{ fileId, userId, shareId, expiresAt }` |

The notifications module subscribes to these events and handles delivery idempotently.

## Database Schema (PostgreSQL)

All tables managed via **TypeORM** migrations.

**Auth schema**

| Table | Key columns |
|-------|-------------|
| `users` | `id` (uuid), `email` (unique), `password` (bcrypt), `name`, `is_verified`, `profile_picture_url`, `created_at`, `updated_at` |

**Files schema**

| Table | Key columns |
|-------|-------------|
| `files` | `id` (uuid), `user_id`, `original_name`, `storage_key`, `size`, `mime_type`, `checksum_sha256`, `created_at`, `deleted_at` (soft-delete) |
| `share_links` | `id` (uuid), `file_id`, `user_id`, `token_hash`, `expires_at`, `created_at` |

Share link expiry is enforced at query time and/or via a scheduled cleanup job.

## Environment

Copy examples and adjust:

- **Gateway**: `services/api-gateway/.env.example` → `.env` (`NATS_URL`, `PORT` / `GATEWAY_PORT`, optional Swagger credentials).
- **App service**: `services/app/.env.example` → `.env`.

| Area | Variables (app service) |
|------|-------------------------|
| PostgreSQL | `DATABASE_URL_AUTH`, `DATABASE_URL_FILE_SHARING` (two databases on the same or different hosts; see `services/app/.env.example`) |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| NATS | `NATS_URL` |
| Files → S3 | `FILE_S3_REGION`, `FILE_S3_BUCKET`, `FILE_S3_ACCESS_KEY`, `FILE_S3_SECRET_KEY` |
| Profile uploads → S3 | `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` |

## Setup

1. **Prerequisites**
   - **Node.js 20+**, **pnpm**
   - **PostgreSQL** reachable (default: `localhost:5432`)
   - **NATS** at `nats://localhost:4222` (or set `NATS_URL` on gateway and app)
   - **S3-compatible storage** and the bucket/key variables above

2. **Install** (repo root):

   ```bash
   pnpm install
   ```

3. **Configure** gateway and app `.env` files per the Environment table above. Set JWT secrets and S3 variables before exercising uploads.

4. **Run database migrations**:

   ```bash
   pnpm run migration:run   # applies pending TypeORM migrations
   ```

5. **Infrastructure with Docker** (NATS + PostgreSQL + full stack):

   ```bash
   docker-compose up --build
   ```

   Gateway: **http://localhost:4000**. Ensure `DATABASE_URL_*`, `FILE_S3_*`, and `JWT_*` are valid for the app container.

6. **Run locally** (two processes minimum: gateway + app; frontend optional):

   ```bash
   pnpm run dev:gateway    # API Gateway at :4000
   pnpm run dev:app        # App service over NATS
   pnpm run dev:frontend   # Vite web app at :5173
   pnpm run dev:mobile     # Expo dev server (iOS / Android)
   ```

   Or run all packages in parallel from root:

   ```bash
   pnpm run dev
   ```

   **Troubleshooting**: `ECONNREFUSED` on `5432` → start PostgreSQL or fix `DATABASE_URL_AUTH` / `DATABASE_URL_FILE_SHARING`. `EADDRINUSE :::4000` → free port 4000. NATS errors → start NATS and align `NATS_URL` on both services.

## Scripts (root)

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build all workspaces that expose `build` |
| `pnpm run dev` | Run `dev` in all workspaces in parallel |
| `pnpm run dev:gateway` | API Gateway only |
| `pnpm run dev:app` | App service (auth + files + notifications) |
| `pnpm run dev:frontend` | Vite web frontend |
| `pnpm run dev:mobile` | Expo mobile app |
| `pnpm run dev:services` | Gateway + app service together |
| `pnpm run migration:run` | Apply pending TypeORM migrations |
| `pnpm run migration:generate:auth` / `migration:generate:files` | Generate a migration for the auth or files database (pass path after `--`, see `infra/postgres/README.md`) |

## Potential Improvements

### Security & Auth

- CSRF protection for cookie-based auth flows
- Refresh token rotation — invalidate the old token on each use
- 2FA / MFA support (TOTP app or SMS)
- End-to-end encryption for share link payloads
- Geo-restriction or IP allowlist on share links

### File Management

- File versioning with point-in-time restore
- Folder / directory organisation
- Bulk operations (multi-select delete, download as zip)
- In-browser file preview (PDF, images, video)
- Virus/malware scanning before accepting uploads (e.g. ClamAV)

### Sharing & Collaboration

- Password-protected share links
- Per-link download limit and view/download count tracking
- Team workspaces with role-based access control (RBAC)
- Webhook / Zapier integration on share events

### Mobile

- Biometric authentication (Face ID / Touch ID) via Expo LocalAuthentication
- Push notifications on share-link access (FCM / APNs via Expo Notifications)
- Offline upload queue — retry uploads when connectivity is restored
- Native OS share sheet for generating and sending links
- Home screen widget showing storage usage

### Developer Experience & Observability

- Distributed tracing with OpenTelemetry across the NATS message flow
- Centralized error tracking (e.g. Sentry)
- Admin dashboard — usage metrics, active users, storage consumed per user
- Background job queue for email delivery and post-upload processing (e.g. BullMQ)

### Infrastructure

- S3 lifecycle policies for automatic cleanup of deleted file objects
- Read replica for the PostgreSQL queries on the files module
- Horizontal scaling of the app service behind a NATS queue group
