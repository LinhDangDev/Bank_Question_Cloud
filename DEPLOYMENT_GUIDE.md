# Docker Build & Digital Ocean Deployment Guide

**Author: Linh Dang Dev**

## 📋 Prerequisites

1. **Docker Hub Account**: [hub.docker.com](https://hub.docker.com)
2. **Digital Ocean Account**: [digitalocean.com](https://digitalocean.com)
3. **Docker Desktop** installed on your local machine
4. **Git** for version control

## 🔧 Step 1: Prepare Environment

### 1.1 Update Docker Configuration

Kiểm tra file `backend/package.json` có script build:

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main"
  }
}
```

### 1.2 Create Production Environment File

Tạo file `backend/.env.production`:

```env
# Database Configuration
DB_HOST=103.173.226.35
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=Pass123@
DB_DATABASE=question_bank
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Application Settings
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-32-characters-long
JWT_EXPIRES_IN=24h

# Digital Ocean Spaces
DIGITALOCEAN_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
DIGITALOCEAN_SPACES_KEY=your_spaces_key
DIGITALOCEAN_SPACES_SECRET=your_spaces_secret
DIGITALOCEAN_SPACES_BUCKET=datauploads

# Storage Configuration
STORAGE_PROVIDER=digitalocean
PUBLIC_URL=https://datauploads.sgp1.digitaloceanspaces.com
```

## 🐳 Step 2: Build Docker Image

### 2.1 Build Image Locally

```bash
# Navigate to project root
cd d:\Code\Graduation

# Build Docker image
docker build -f Dockerfile -t lighthunter15723/question-bank-backend:latest .
```

### 2.2 Test Image Locally

```bash
# Run container locally to test
docker run -d \
  --name test-backend \
  -p 3001:3001 \
  --env-file backend/.env.production \
  lighthunter15723/question-bank-backend:latest

# Check logs
docker logs test-backend

# Test API
curl http://localhost:3001/api/health

# Stop test container
docker stop test-backend
docker rm test-backend
```

## 📤 Step 3: Push to Docker Hub

### 3.1 Login to Docker Hub

```bash
# Login to Docker Hub
docker login

# Enter your Docker Hub credentials
Username: lighthunter15723
Password: [your_password]
```

### 3.2 Push Image

```bash
# Push image to Docker Hub
docker push lighthunter15723/question-bank-backend:latest

# Verify push
docker images | grep lighthunter15723
```

### 3.3 Alternative: Use Build Script

```bash
# Use the existing build script (Windows)
cd backend
docker-build-push.bat

# Or create Linux version
chmod +x docker-build-push.sh
./docker-build-push.sh
```

## 🌊 Step 4: Deploy to Digital Ocean

### 4.1 Create Digital Ocean Droplet

1. **Login to Digital Ocean Console**
2. **Create Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic - $12/month (2GB RAM, 1 vCPU)
   - **Region**: Singapore (SGP1)
   - **Authentication**: SSH Key (recommended)
   - **Hostname**: question-bank-server

### 4.2 Connect to Droplet

```bash
# SSH to your droplet
ssh root@167.71.221.12

# Or if using SSH key
ssh -i ~/.ssh/your_key root@167.71.221.12
```

### 4.3 Install Docker on Droplet

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 4.4 Setup Application Directory

```bash
# Create app directory
mkdir -p /opt/question-bank
cd /opt/question-bank

# Create necessary directories
mkdir -p uploads/{questions,temp,audio,image} output logs
chmod -R 755 uploads output logs
```

### 4.5 Create Production Docker Compose

Tạo file `/opt/question-bank/docker-compose.yml`:

```yaml
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
      - DB_USERNAME=sa
      - DB_PASSWORD=Pass123@
      - DB_DATABASE=question_bank
      - DB_ENCRYPT=false
      - DB_TRUST_SERVER_CERTIFICATE=true
      - JWT_SECRET=your-super-secret-jwt-key-32-characters-long
      - JWT_EXPIRES_IN=24h
      - DIGITALOCEAN_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
      - DIGITALOCEAN_SPACES_KEY=your_spaces_key
      - DIGITALOCEAN_SPACES_SECRET=your_spaces_secret
      - DIGITALOCEAN_SPACES_BUCKET=datauploads
      - STORAGE_PROVIDER=digitalocean
      - PUBLIC_URL=https://datauploads.sgp1.digitaloceanspaces.com
    volumes:
      - ./uploads:/app/uploads
      - ./output:/app/output
      - ./logs:/app/logs
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

volumes:
  redis_data:
```

## 🚀 Step 5: Deploy Application

### 5.1 Pull and Start

```bash
cd /opt/question-bank

# Pull latest image
docker pull lighthunter15723/question-bank-backend:latest

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

### 5.2 Configure Firewall

```bash
# Install UFW if not installed
apt install ufw -y

# Configure firewall
ufw allow ssh
ufw allow 3001/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
ufw status
```

### 5.3 Setup Nginx (Optional)

```bash
# Install Nginx
apt install nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/question-bank << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/question-bank /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔄 Step 6: Update Deployment

### 6.1 Create Update Script

Tạo file `/opt/question-bank/update.sh`:

```bash
#!/bin/bash
echo "🔄 Updating Question Bank Backend..."

# Pull latest image
docker pull lighthunter15723/question-bank-backend:latest

# Stop current container
docker-compose down

# Start with new image
docker-compose up -d

# Show status
docker-compose ps

echo "✅ Update completed!"
```

```bash
chmod +x update.sh
```

### 6.2 Update Process

```bash
# On your local machine - build and push new version
docker build -f Dockerfile -t lighthunter15723/question-bank-backend:latest .
docker push lighthunter15723/question-bank-backend:latest

# On Digital Ocean droplet - update
cd /opt/question-bank
./update.sh
```

## 📊 Step 7: Monitoring & Maintenance

### 7.1 Check Application Status

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f redis

# Check resource usage
docker stats

# Check disk usage
df -h
du -sh /opt/question-bank/*
```

### 7.2 Backup Strategy

```bash
# Create backup script
cat > /opt/question-bank/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab for daily backup
echo "0 2 * * * /opt/question-bank/backup.sh" | crontab -
```

## 🔧 Troubleshooting

### Common Issues:

1. **Container won't start**:
   ```bash
   docker-compose logs backend
   ```

2. **Database connection issues**:
   ```bash
   # Test database connection
   docker exec -it question-bank-backend node -e "console.log('Testing DB connection...')"
   ```

3. **Port already in use**:
   ```bash
   sudo netstat -tulpn | grep :3001
   sudo kill -9 <PID>
   ```

4. **Out of disk space**:
   ```bash
   # Clean Docker
   docker system prune -a
   
   # Clean logs
   docker-compose logs --tail=100 backend > recent_logs.txt
   truncate -s 0 /var/lib/docker/containers/*/*-json.log
   ```

## 📝 Quick Commands Reference

```bash
# Build and push
docker build -f Dockerfile -t lighthunter15723/question-bank-backend:latest .
docker push lighthunter15723/question-bank-backend:latest

# Deploy on server
cd /opt/question-bank
docker pull lighthunter15723/question-bank-backend:latest
docker-compose up -d

# Monitor
docker-compose ps
docker-compose logs -f backend

# Update
./update.sh
```

---

**Author**: Linh Dang Dev  
**Last Updated**: 2025-07-11
