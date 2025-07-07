#!/bin/bash

# ===========================================
# SIMPLE DEPLOYMENT SCRIPT
# ===========================================
# Script đơn giản để deploy Question Bank lên Digital Ocean

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Question Bank - Simple Deployment Script${NC}"
echo "=============================================="

# Get user input
read -p "Nhập IP address của Droplet: " DROPLET_IP
read -p "Nhập Database Username: " DB_USER
read -s -p "Nhập Database Password: " DB_PASS
echo ""
read -p "Nhập JWT Secret (32 ký tự): " JWT_SECRET

echo -e "${BLUE}📦 Bắt đầu deployment...${NC}"

# Step 1: Install Docker
echo -e "${BLUE}1. Cài đặt Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Step 2: Install Docker Compose
echo -e "${BLUE}2. Cài đặt Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Step 3: Create project directory
echo -e "${BLUE}3. Tạo project directory...${NC}"
mkdir -p /opt/question-bank
cd /opt/question-bank

# Step 4: Create docker-compose.yml
echo -e "${BLUE}4. Tạo docker-compose.yml...${NC}"
cat > docker-compose.yml << EOF
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
      - DB_HOST=103.173.226.35
      - DB_PORT=1433
      - DB_USERNAME=${DB_USER}
      - DB_PASSWORD=${DB_PASS}
      - DB_DATABASE=question_bank
      - JWT_SECRET=${JWT_SECRET}
      - STORAGE_PROVIDER=local
      - PUBLIC_URL=http://${DROPLET_IP}:3001
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

  redis:
    image: redis:7-alpine
    container_name: question-bank-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
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
EOF

# Step 5: Pull and start containers
echo -e "${BLUE}5. Pull Docker images...${NC}"
docker-compose pull

echo -e "${BLUE}6. Start containers...${NC}"
docker-compose up -d

# Step 6: Setup firewall
echo -e "${BLUE}7. Cấu hình firewall...${NC}"
ufw allow ssh
ufw allow 3001
ufw --force enable

# Step 7: Wait and health check
echo -e "${BLUE}8. Kiểm tra health...${NC}"
echo "Đợi containers khởi động..."
sleep 30

# Health check
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
echo -e "${GREEN}🎉 DEPLOYMENT THÀNH CÔNG!${NC}"
echo "================================"
echo -e "API URL: ${YELLOW}http://${DROPLET_IP}:3001/api${NC}"
echo -e "Health Check: ${YELLOW}http://${DROPLET_IP}:3001/api/health${NC}"
echo -e "API Docs: ${YELLOW}http://${DROPLET_IP}:3001/api-docs${NC}"
echo ""

# Show container status
echo -e "${BLUE}Container Status:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "- Xem logs: docker-compose logs -f"
echo "- Restart: docker-compose restart"
echo "- Stop: docker-compose down"
echo "- Update: docker-compose pull && docker-compose up -d"

# Create management script
echo -e "${BLUE}9. Tạo management script...${NC}"
cat > manage.sh << 'EOF'
#!/bin/bash

case "$1" in
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    "restart")
        docker-compose restart
        ;;
    "stop")
        docker-compose down
        ;;
    "start")
        docker-compose up -d
        ;;
    "update")
        docker-compose pull
        docker-compose up -d
        ;;
    "health")
        curl -s http://localhost:3001/api/health | jq .
        ;;
    *)
        echo "Usage: $0 {logs|status|restart|stop|start|update|health}"
        ;;
esac
EOF

chmod +x manage.sh

echo ""
echo -e "${GREEN}✅ Setup hoàn tất!${NC}"
echo -e "Sử dụng: ${YELLOW}./manage.sh [logs|status|restart|stop|start|update|health]${NC}"
