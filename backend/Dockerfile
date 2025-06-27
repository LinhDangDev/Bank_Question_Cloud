FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy application source
COPY . .

# Create .env.example if not exists
RUN if [ ! -f .env.example ]; then \
    echo "# Database Configuration\nDB_HOST=localhost\nDB_PORT=1433\nDB_USERNAME=username\nDB_PASSWORD=password\nDB_DATABASE=question_bank\n\n# Application Configuration\nPORT=3001\nNODE_ENV=development" > .env.example; \
    fi

# Expose application port
EXPOSE 3001

# Start application
CMD ["pnpm", "run", "start"]
