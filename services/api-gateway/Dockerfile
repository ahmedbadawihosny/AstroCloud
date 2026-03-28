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
RUN pnpm install && pnpm --filter @file-sharing-app/common run build && pnpm --filter api-gateway run build

FROM builder AS pruner
WORKDIR /app
ENV CI=1
RUN pnpm prune --prod

# Production: reuse workspace node_modules + built artifacts (workspace:* cannot `pnpm install` from a single package.json)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=pruner /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/packages/common/package.json ./packages/common/
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=pruner /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
WORKDIR /app/services/api-gateway
EXPOSE 4000
CMD ["node", "dist/main.js"]
