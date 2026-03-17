FROM node:20-alpine AS base
RUN corepack enable && pnpm add -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/common/package.json ./packages/common/
COPY services/api-gateway/package.json ./services/api-gateway/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm install && pnpm --filter @file-sharing-app/common run build && pnpm --filter api-gateway run build

FROM base AS runner
COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
RUN pnpm install --prod
EXPOSE 4000
CMD ["node", "dist/main.js"]
