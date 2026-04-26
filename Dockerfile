# Multi-stage Docker build for backend (NestJS + Bun)
FROM oven/bun:1-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 py3-pip tini

# Builder
FROM base AS builder
COPY backend/package.json backend/bun.lockb* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile
COPY backend/ ./
RUN bun run build

# Production
FROM base AS production
COPY backend/package.json backend/bun.lockb* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/template ./template
COPY --from=builder /app/python ./python

ENV NODE_ENV=production
ENV PORT=3001

RUN mkdir -p uploads/questions uploads/temp uploads/audio uploads/image output exports && \
    chmod -R 755 uploads output exports

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "dist/src/main.js"]