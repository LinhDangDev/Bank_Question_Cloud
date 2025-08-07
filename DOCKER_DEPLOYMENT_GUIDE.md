# 🐳 Hướng Dẫn Build Docker và Deploy lên Digital Ocean

**Author:** Linh Dang Dev  
**Date:** 2025-07-11  
**Project:** Question Bank System

## 📋 Mục Lục

1. [Chuẩn Bị](#chuẩn-bị)
2. [Build Docker Image](#build-docker-image)
3. [Push lên Docker Hub](#push-lên-docker-hub)
4. [Deploy lên Digital Ocean](#deploy-lên-digital-ocean)
5. [Quản Lý và Monitoring](#quản-lý-và-monitoring)
6. [Troubleshooting](#troubleshooting)

## 🛠️ Chuẩn Bị

### 1. Yêu Cầu Hệ Thống
- Docker Desktop đã cài đặt và chạy
- Docker Hub account
- Digital Ocean Droplet (Ubuntu 20.04+)
- SSH access vào droplet

### 2. Kiểm Tra Cấu Hình
```bash
# Kiểm tra Docker
docker --version
docker-compose --version

# Kiểm tra Docker đang chạy
docker info
```

### 3. Cấu Hình Environment Variables
Tạo file `.env.production` trong thư mục `backend/`:

```env
# Database Configuration
NODE_ENV=production
DB_ENV=server
SERVER_DB_HOST=103.173.226.35
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=sa
SERVER_DB_PASSWORD=Pass123@
SERVER_DB_DATABASE=question_bank
SERVER_DB_ENCRYPT=false
SERVER_DB_TRUST_SERVER_CERTIFICATE=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Storage Configuration
STORAGE_PROVIDER=digitalocean
DIGITALOCEAN_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
DIGITALOCEAN_SPACES_KEY=your-spaces-key
DIGITALOCEAN_SPACES_SECRET=your-spaces-secret
DIGITALOCEAN_SPACES_BUCKET=datauploads

# Application Configuration
PUBLIC_URL=http://167.71.221.12:3001
BACKEND_PORT=3001
```

## 🔨 Build Docker Image

### Phương Pháp 1: Sử dụng Script PowerShell (Khuyến nghị)

```powershell
# Chạy trong thư mục backend/
.\docker-build-push.ps1
```

Script sẽ:
- Hỏi Docker Hub username
- Build image với Dockerfile.production
- Login Docker Hub
- Push image lên registry

### Phương Pháp 2: Build Thủ Công

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Build Docker image
docker build -f Dockerfile.production -t lighthunter15723/question-bank-backend:latest .

# 3. Build với tag timestamp
docker build -f Dockerfile.production \
  -t lighthunter15723/question-bank-backend:latest \
  -t lighthunter15723/question-bank-backend:$(date +%Y%m%d_%H%M%S) \
  .

# 4. Kiểm tra image đã build
docker images | grep question-bank-backend
```

### Phương Pháp 3: Sử dụng Script Bash (Linux/Mac)

```bash
# Chạy script build và deploy
./build-and-deploy.sh
```

## 📤 Push lên Docker Hub

### 1. Login Docker Hub
```bash
docker login
# Nhập username: lighthunter15723
# Nhập password: your-docker-hub-token
```

### 2. Push Image
```bash
# Push latest tag
docker push lighthunter15723/question-bank-backend:latest

# Push specific tag
docker push lighthunter15723/question-bank-backend:20250711_200000
```

### 3. Verify Push
```bash
# Kiểm tra trên Docker Hub
# https://hub.docker.com/r/lighthunter15723/question-bank-backend
```

## 🚀 Deploy lên Digital Ocean

### 1. SSH vào Droplet
```bash
ssh root@167.71.221.12
```

### 2. Cài Đặt Docker (nếu chưa có)
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker service
systemctl start docker
systemctl enable docker
```

### 3. Tạo Thư Mục Project
```bash
# Tạo thư mục cho project
mkdir -p /opt/question-bank
cd /opt/question-bank

# Tạo các thư mục cần thiết
mkdir -p uploads/{questions,temp,audio,image} output logs
chmod -R 755 uploads output logs
```

### 4. Tạo File docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend (NestJS)
  backend:
    image: lighthunter15723/question-bank-backend:latest
    container_name: question-bank-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_ENV=server
      - SERVER_DB_HOST=103.173.226.35
      - SERVER_DB_PORT=1433
      - SERVER_DB_USERNAME=sa
      - SERVER_DB_PASSWORD=Pass123@
      - SERVER_DB_DATABASE=question_bank
      - SERVER_DB_ENCRYPT=false
      - SERVER_DB_TRUST_SERVER_CERTIFICATE=true
      - JWT_SECRET=your-super-secret-jwt-key-here
      - JWT_EXPIRES_IN=24h
      - STORAGE_PROVIDER=digitalocean
      - DIGITALOCEAN_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
      - DIGITALOCEAN_SPACES_KEY=your-spaces-key
      - DIGITALOCEAN_SPACES_SECRET=your-spaces-secret
      - DIGITALOCEAN_SPACES_BUCKET=datauploads
      - PUBLIC_URL=http://167.71.221.12:3001
    volumes:
      - ./uploads:/app/uploads
      - ./output:/app/output
      - ./logs:/app/logs
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis (Caching)
  redis:
    image: redis:alpine
    container_name: question-bank-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  redis_data:
EOF
```

### 5. Deploy Application
```bash
# Pull latest image
docker pull lighthunter15723/question-bank-backend:latest

# Stop existing containers (nếu có)
docker-compose down

# Start containers
docker-compose up -d

# Kiểm tra status
docker-compose ps
docker-compose logs -f backend
```

## 📊 Quản Lý và Monitoring

### 1. Kiểm Tra Logs
```bash
# Xem logs real-time
docker-compose logs -f backend

# Xem logs với số dòng giới hạn
docker-compose logs --tail=100 backend

# Xem logs của tất cả services
docker-compose logs -f
```

### 2. Health Check
```bash
# Kiểm tra health endpoint
curl http://167.71.221.12:3001/api/health

# Kiểm tra container status
docker ps
docker stats
```

### 3. Update Application
```bash
# Script tự động update
cat > update-app.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Question Bank Backend..."

# Pull latest image
echo "📥 Pulling latest image..."
docker pull lighthunter15723/question-bank-backend:latest

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose down

# Start with new image
echo "🚀 Starting updated containers..."
docker-compose up -d

# Wait for startup
echo "⏳ Waiting for startup..."
sleep 30

# Check status
echo "✅ Checking status..."
docker-compose ps
curl -f http://localhost:3001/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"

echo "🎉 Update completed!"
EOF

chmod +x update-app.sh
```

### 4. Backup và Restore
```bash
# Backup uploads
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz uploads/

# Backup database (nếu cần)
# Sử dụng SQL Server backup tools

# Restore uploads
tar -xzf backup-uploads-20250711.tar.gz
```

## 🔧 Troubleshooting

### 1. Container Không Start
```bash
# Kiểm tra logs
docker-compose logs backend

# Kiểm tra cấu hình
docker-compose config

# Restart container
docker-compose restart backend
```

### 2. Database Connection Issues
```bash
# Test database connection từ container
docker exec -it question-bank-backend sh
# Trong container:
curl -f http://localhost:3001/api/health
```

### 3. Memory Issues
```bash
# Kiểm tra memory usage
docker stats

# Tăng memory limit (trong docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 4. Port Conflicts
```bash
# Kiểm tra port đang sử dụng
netstat -tulpn | grep :3001

# Kill process sử dụng port
sudo kill -9 $(sudo lsof -t -i:3001)
```

## 🎯 Quick Commands

```bash
# Deploy mới
docker-compose up -d

# Update app
./update-app.sh

# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend

# Scale services
docker-compose up -d --scale backend=2

# Cleanup
docker system prune -a
```

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Docker logs: `docker-compose logs backend`
2. Health endpoint: `curl http://167.71.221.12:3001/api/health`
3. Database connectivity
4. Digital Ocean Spaces configuration

**Contact:** Linh Dang Dev  
**Repository:** https://github.com/your-repo/question-bank
