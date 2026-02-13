# Dockerfile for Fly.io - BRAVOS BRASIL Backend
# Build context should be from project root
# Schema outputs to ../server/node_modules/.prisma/client — layout must match
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy Prisma schema (INVARIANTE A)
COPY prisma ./prisma

# Install server deps under server/ so schema output path ../server/node_modules/.prisma/client resolves
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --only=production

# Generate Prisma Client (INVARIANTE B/C — prisma@5.22.0, before build/start)
RUN cd server && npx prisma@5.22.0 generate --schema=../prisma/schema.prisma

# Build stage
FROM base AS builder
WORKDIR /app

# Copy Prisma (INVARIANTE A)
COPY prisma ./prisma

# Install server deps under server/
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Generate Prisma Client (INVARIANTE B/C)
RUN cd server && npx prisma@5.22.0 generate --schema=../prisma/schema.prisma

# Copy source code
COPY server/tsconfig.json server/index.ts ./server/
COPY server/routes ./server/routes
COPY server/utils ./server/utils
COPY server/services ./server/services
COPY server/integrations ./server/integrations
COPY server/config ./server/config
COPY server/types ./server/types

# Build TypeScript
RUN cd server && npm run build

# Production stage
FROM base AS runner

ARG BUILD_SHA
ENV BUILD_SHA=$BUILD_SHA

# Adicionar OpenSSL para Prisma funcionar no Alpine (Fly.io)
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built application (dist + node_modules from server/ where .prisma was generated)
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json
COPY --from=deps /app/server/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=2s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
