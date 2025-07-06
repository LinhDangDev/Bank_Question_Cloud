FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build the application
RUN pnpm run build

# Create necessary directories
RUN mkdir -p uploads/questions uploads/temp uploads/audio public

# Expose application port
EXPOSE 3001

# Start application in production mode
CMD ["pnpm", "run", "start:prod"]
