# `@file-sharing-app/common`

Workspace package shared by **`services/app`** (and listed on the gateway for installs). **Build output** is **`dist/`**; import from **`@file-sharing-app/common`** (never from `src` in consumers).

## What’s implemented

| Export | Role |
|--------|------|
| **`NatsModule`**, **`NatsClient`** | Global Nest module: connects using **`NATS_URL`** / **`NATS_SERVERS`**, publish/subscribe for events |
| **`EVENTS`** | Stable subject names: `user_created`, `file_uploaded`, `file_deleted`, `file_shared` |

## Placeholders (stubs for future use)

`auth/`, `dto/`, `filters/`, `interceptors/` export string constants or minimal types only — not wired as Nest providers yet.

## Scripts

```bash
pnpm run build    # tsc → dist/
pnpm run dev      # tsc --watch
```

From the repo root: **`pnpm --filter @file-sharing-app/common run build`**.
