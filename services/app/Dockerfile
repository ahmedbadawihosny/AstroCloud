FROM node:20-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/common/package.json ./packages/common/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/app/package.json ./services/app/
COPY frontend/package.json ./frontend/
COPY mobile/package.json ./mobile/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm install && pnpm --filter @file-sharing-app/common run build && pnpm --filter @file-sharing-app/app-service run build

FROM builder AS pruner
WORKDIR /app
ENV CI=1
RUN pnpm prune --prod

FROM base AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=nestjs:nodejs --from=pruner /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --chown=nestjs:nodejs --from=pruner /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=pruner /app/packages/common/package.json ./packages/common/
COPY --chown=nestjs:nodejs --from=builder /app/packages/common/dist ./packages/common/dist
COPY --chown=nestjs:nodejs --from=pruner /app/services/app/package.json ./services/app/
COPY --chown=nestjs:nodejs --from=builder /app/services/app/dist ./services/app/dist
WORKDIR /app/services/app
USER nestjs
CMD ["node", "dist/main.js"]
