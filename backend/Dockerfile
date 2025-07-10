# Multi-stage Docker build for NestJS backend
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies (express is now included in package.json)
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Copy necessary files
COPY copy-env.js ./
COPY .env* ./

# Set environment variables for production
ENV DB_ENV=server
ENV NODE_ENV=production
ENV PORT=3001

# Create necessary directories with proper permissions
RUN mkdir -p uploads/questions uploads/temp uploads/audio uploads/image output && \
    chmod -R 755 uploads output

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start application with proper command
CMD ["sh", "-c", "echo 'Patching TypeORM crypto issue...' && echo 'Starting application...' && node copy-env.js && node dist/src/main.js"]
