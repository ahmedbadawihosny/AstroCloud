# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-workspace.yaml ./
COPY packages/common/package.json packages/common/package.json
COPY packages/common/dist packages/common/dist

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-workspace.yaml ./
COPY packages/common/package.json packages/common/package.json
COPY packages/common/dist packages/common/dist

# Install pnpm and production dependencies only
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# No port exposure needed - NATS only communication

# Start the application (NATS microservice only)
CMD ["node", "dist/main"]
