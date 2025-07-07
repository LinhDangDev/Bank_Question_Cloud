#!/bin/bash

# ===========================================
# REBUILD AND DEPLOY SCRIPT
# ===========================================
# Script để rebuild Docker image và deploy lại

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Rebuild and Deploy Script${NC}"
echo "=================================="

# Configuration
DOCKER_USERNAME="lighthunter15723"
IMAGE_NAME="question-bank-backend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

# Step 1: Build new Docker image
echo -e "${BLUE}1. Building new Docker image...${NC}"
cd backend

# Build with production Dockerfile
docker build -f Dockerfile.production -t ${FULL_IMAGE_NAME} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

# Step 2: Test image locally (optional)
echo -e "${BLUE}2. Testing image locally...${NC}"
docker run --rm -d --name test-backend \
    -e NODE_ENV=production \
    -e DB_HOST=103.173.226.35 \
    -e DB_PORT=1433 \
    -e DB_USERNAME=sa \
    -e DB_PASSWORD=Pass123@ \
    -e DB_DATABASE=question_bank \
    -e JWT_SECRET=test-secret-key-32-characters-long \
    -e STORAGE_PROVIDER=local \
    -e PUBLIC_URL=http://localhost:3001 \
    -e REDIS_HOST=localhost \
    -e REDIS_PORT=6379 \
    -p 3002:3001 \
    ${FULL_IMAGE_NAME}

# Wait for container to start
sleep 10

# Test health endpoint
if curl -f -s http://localhost:3002/api/health > /dev/null; then
    echo -e "${GREEN}✅ Local test passed${NC}"
    docker stop test-backend
else
    echo -e "${YELLOW}⚠️ Local test failed, but continuing with push${NC}"
    docker stop test-backend || true
fi

# Step 3: Push to Docker Hub
echo -e "${BLUE}3. Pushing to Docker Hub...${NC}"
docker push ${FULL_IMAGE_NAME}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image pushed successfully${NC}"
else
    echo -e "${RED}❌ Failed to push image${NC}"
    exit 1
fi

# Step 4: Instructions for server deployment
echo ""
echo -e "${GREEN}🎉 Image rebuilt and pushed successfully!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Next steps on your server:${NC}"
echo "1. SSH to your droplet:"
echo "   ssh root@YOUR_DROPLET_IP"
echo ""
echo "2. Navigate to project directory:"
echo "   cd /opt/question-bank"
echo ""
echo "3. Pull new image and restart:"
echo "   docker-compose pull"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
echo "4. Check status:"
echo "   docker-compose ps"
echo "   docker-compose logs -f backend"
echo ""
echo -e "${BLUE}Or use the one-liner:${NC}"
echo "docker-compose pull && docker-compose down && docker-compose up -d"

# Step 5: Create updated docker-compose for server
echo ""
echo -e "${BLUE}4. Creating updated docker-compose.yml...${NC}"
cd ..

cat > docker-compose.server-update.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: lighthunter15723/question-bank-backend:latest
    container_name: question-bank-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_ENV=server
      - DB_HOST=103.173.226.35
      - DB_PORT=1433
      - DB_USERNAME=${DB_USERNAME:-sa}
      - DB_PASSWORD=${DB_PASSWORD:-Pass123@}
      - DB_DATABASE=question_bank
      - JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-32-characters-long}
      - STORAGE_PROVIDER=local
      - PUBLIC_URL=${PUBLIC_URL:-http://localhost:3001}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - uploads:/app/uploads
      - output:/app/output
      - public:/app/public
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: question-bank-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  uploads:
    name: question-bank-uploads
  output:
    name: question-bank-output
  public:
    name: question-bank-public
  redis_data:
    name: question-bank-redis

networks:
  default:
    name: question-bank-network
    driver: bridge
EOF

echo -e "${GREEN}✅ Updated docker-compose.yml created${NC}"
echo ""
echo -e "${BLUE}Copy this file to your server:${NC}"
echo "scp docker-compose.server-update.yml root@YOUR_DROPLET_IP:/opt/question-bank/docker-compose.yml"

# Cleanup
echo ""
echo -e "${BLUE}5. Cleaning up local test containers...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}🚀 Rebuild and push completed!${NC}"
echo -e "${YELLOW}Don't forget to update your server with the new image.${NC}"
