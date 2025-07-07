#!/bin/bash

# ===========================================
# FIX SERVER DEPLOYMENT SCRIPT
# ===========================================
# Script để fix vấn đề crypto trên server hiện tại

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fix Server Deployment${NC}"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found. Please run this script from /opt/question-bank${NC}"
    exit 1
fi

# Step 1: Stop current containers
echo -e "${BLUE}1. Stopping current containers...${NC}"
docker-compose down

# Step 2: Create new docker-compose.yml with fixed configuration
echo -e "${BLUE}2. Creating fixed docker-compose.yml...${NC}"

# Backup current file
cp docker-compose.yml docker-compose.yml.backup

# Create new configuration
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: node:20-alpine
    container_name: question-bank-backend
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_ENV=server
      - DB_HOST=103.173.226.35
      - DB_PORT=1433
      - DB_USERNAME=sa
      - DB_PASSWORD=Pass123@
      - DB_DATABASE=question_bank
      - JWT_SECRET=your-super-secret-jwt-key-32-characters-long-fix
      - STORAGE_PROVIDER=local
      - PUBLIC_URL=http://YOUR_DROPLET_IP:3001
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - uploads:/app/uploads
      - output:/app/output
      - public:/app/public
      - ./app-files:/app
    depends_on:
      - redis
    command: sh -c "apk add --no-cache curl && npm install -g pnpm && cd /app && pnpm install --prod && node dist/src/main.js"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

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

# Step 3: Extract application files from the problematic image
echo -e "${BLUE}3. Extracting application files...${NC}"

# Create temporary container to extract files
docker create --name temp-extract lighthunter15723/question-bank-backend:latest
mkdir -p app-files

# Extract the built application
docker cp temp-extract:/app/dist ./app-files/
docker cp temp-extract:/app/package.json ./app-files/
docker cp temp-extract:/app/pnpm-lock.yaml ./app-files/
docker cp temp-extract:/app/public ./app-files/ 2>/dev/null || echo "No public directory"

# Clean up temp container
docker rm temp-extract

# Step 4: Fix the crypto issue by creating a polyfill
echo -e "${BLUE}4. Creating crypto polyfill...${NC}"
mkdir -p app-files/dist/src
cat > app-files/crypto-polyfill.js << 'EOF'
// Crypto polyfill for Node.js compatibility
if (typeof global !== 'undefined' && !global.crypto) {
    global.crypto = require('crypto').webcrypto || require('crypto');
}
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto || require('crypto');
}
EOF

# Modify main.js to include the polyfill
if [ -f "app-files/dist/src/main.js" ]; then
    # Add polyfill at the beginning
    echo "require('../crypto-polyfill.js');" > temp-main.js
    cat app-files/dist/src/main.js >> temp-main.js
    mv temp-main.js app-files/dist/src/main.js
fi

# Step 5: Get user input for configuration
echo -e "${BLUE}5. Configuration setup...${NC}"
read -p "Enter your Droplet IP address: " DROPLET_IP
read -p "Enter Database Username (default: sa): " DB_USER
DB_USER=${DB_USER:-sa}
read -s -p "Enter Database Password: " DB_PASS
echo ""

# Update docker-compose.yml with actual values
sed -i "s/YOUR_DROPLET_IP/$DROPLET_IP/g" docker-compose.yml
sed -i "s/DB_USERNAME=sa/DB_USERNAME=$DB_USER/g" docker-compose.yml
sed -i "s/DB_PASSWORD=Pass123@/DB_PASSWORD=$DB_PASS/g" docker-compose.yml

# Step 6: Start the fixed deployment
echo -e "${BLUE}6. Starting fixed deployment...${NC}"
docker-compose up -d

# Step 7: Wait and check health
echo -e "${BLUE}7. Waiting for services to start...${NC}"
sleep 60

# Check container status
echo -e "${BLUE}Container Status:${NC}"
docker-compose ps

# Check logs
echo -e "${BLUE}Backend Logs (last 20 lines):${NC}"
docker-compose logs --tail=20 backend

# Health check
echo -e "${BLUE}8. Testing health endpoint...${NC}"
for i in {1..10}; do
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        echo "Attempt $i/10: Waiting for backend..."
        sleep 10
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Health check failed after 10 attempts${NC}"
        echo "Checking logs..."
        docker-compose logs backend
        exit 1
    fi
done

# Step 8: Show results
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT FIXED!${NC}"
echo "===================="
echo -e "API URL: ${YELLOW}http://$DROPLET_IP:3001/api${NC}"
echo -e "Health Check: ${YELLOW}http://$DROPLET_IP:3001/api/health${NC}"
echo -e "API Docs: ${YELLOW}http://$DROPLET_IP:3001/api-docs${NC}"
echo ""

# Create management script
cat > manage.sh << 'EOF'
#!/bin/bash

case "$1" in
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        ;;
    "restart")
        docker-compose restart "${2:-}"
        ;;
    "stop")
        docker-compose down
        ;;
    "start")
        docker-compose up -d
        ;;
    "health")
        curl -s http://localhost:3001/api/health
        ;;
    "backend-logs")
        docker-compose logs -f backend
        ;;
    *)
        echo "Usage: $0 {logs|status|restart|stop|start|health|backend-logs}"
        ;;
esac
EOF

chmod +x manage.sh

echo -e "${GREEN}✅ Management script created: ./manage.sh${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "- ./manage.sh logs          # View all logs"
echo "- ./manage.sh backend-logs  # View backend logs only"
echo "- ./manage.sh status        # Check container status"
echo "- ./manage.sh health        # Test health endpoint"
echo "- ./manage.sh restart       # Restart all services"
