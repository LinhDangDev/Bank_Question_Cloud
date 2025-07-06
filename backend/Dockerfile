FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Debug: List files in current directory
RUN echo "=== Current directory contents ===" && ls -la

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Debug: Verify package files copied
RUN echo "=== After copying package files ===" && ls -la

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Debug: List all files after copy
RUN echo "=== After copying all files ===" && ls -la

# Build the application
RUN pnpm run build

# Create necessary directories
RUN mkdir -p uploads/questions uploads/temp uploads/audio public

# Expose application port
EXPOSE 3001

# Start application in production mode
CMD ["pnpm", "run", "start:prod"]
