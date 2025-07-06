FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Create package.json if it doesn't exist
RUN echo '{"name":"app","version":"1.0.0"}' > package.json

# Install pnpm globally
RUN pnpm setup
RUN mkdir -p /root/.local/share/pnpm
ENV PATH="/root/.local/share/pnpm:$PATH"

# Copy application files
COPY . .

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm run build

# Create necessary directories
RUN mkdir -p uploads/questions uploads/temp uploads/audio public

# Expose application port
EXPOSE 3001

# Start application in production mode
CMD ["pnpm", "run", "start:prod"]
