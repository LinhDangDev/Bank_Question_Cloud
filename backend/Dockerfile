# Multi-stage Docker build for NestJS backend with Bun
# Builder stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install Python (required by docx_parser.py at runtime, also build deps)
RUN apk add --no-cache python3 py3-pip

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Python runtime + native build tools for deps like sharp, bcrypt, msnodesqlv8
RUN apk add --no-cache python3 py3-pip tini

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/template ./template
COPY --from=builder /app/python ./python

ENV NODE_ENV=production
ENV PORT=3001

RUN mkdir -p uploads/questions uploads/temp uploads/audio uploads/image output exports && \
    chmod -R 755 uploads output exports

# Non-root user
RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "dist/src/main.js"]