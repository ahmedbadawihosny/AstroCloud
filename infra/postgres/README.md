# PostgreSQL

The app service uses **two** connection strings (see `services/app/.env.example`):

- **`DATABASE_URL_AUTH`** — users, accounts, refresh tokens, email verification, password resets  
- **`DATABASE_URL_FILE_SHARING`** — `files` and `share_links` (no foreign keys to the auth DB; `userId` is a logical UUID reference)

Create the databases on your server, then from the repo root:

```bash
pnpm run migration:run
```

That runs auth migrations, then files migrations (each database has its own `migrations` history table).

### Docker Compose

The Postgres service sets `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB=auth_db` and mounts **`init-databases.sql`**, which creates **`file_sharing_db`** and grants **`fileshare`** access (including **`public`** schema for PostgreSQL 15+). That matches **`services/app/.env.example`** URLs. If you rename databases after a volume already exists, remove the volume or recreate the cluster.

For local migration runs against the published port:

```bash
set DATABASE_URL_AUTH=postgresql://fileshare:fileshare@localhost:5432/auth_db
set DATABASE_URL_FILE_SHARING=postgresql://fileshare:fileshare@localhost:5432/file_sharing_db
pnpm run migration:run
```

(Use `export` on Unix.)

### Generating new migrations

```bash
cd services/app
pnpm run migration:generate:auth -- src/migrations/YourAuthMigrationName
pnpm run migration:generate:files -- src/migrations/YourFilesMigrationName
```

Then register the new class in `data-source-auth.ts` or `data-source-files.ts`.
