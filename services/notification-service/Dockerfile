FROM node:20-alpine AS base
RUN corepack enable && pnpm add -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/common/package.json ./packages/common/
COPY services/notification-service/package.json ./services/notification-service/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm install && pnpm --filter @file-sharing-app/common run build && pnpm --filter notification-service run build

FROM base AS runner
COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/services/notification-service/package.json ./
RUN pnpm install --prod
CMD ["node", "dist/main.js"]
