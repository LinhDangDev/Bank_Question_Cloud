#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deploy Question Bank Backend to Digital Ocean
Author: Linh Dang Dev
Created: 2025-07-11
Description: Script tự động deploy ứng dụng lên Digital Ocean
"""

import subprocess
import sys
import os
import time
from datetime import datetime

# Cấu hình
DOCKER_USERNAME = "lighthunter15723"
IMAGE_NAME = "question-bank-backend"
DROPLET_IP = "167.71.221.12"
DROPLET_USER = "root"

def print_header(message):
    """In header với màu sắc"""
    print(f"\n{'='*60}")
    print(f"🚀 {message}")
    print(f"{'='*60}")

def print_step(step, message):
    """In bước thực hiện"""
    print(f"\n📋 Bước {step}: {message}")
    print("-" * 50)

def run_command(command, description="", check=True):
    """Chạy command và hiển thị kết quả"""
    if description:
        print(f"🔄 {description}")
    
    print(f"💻 Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=check, 
                              capture_output=True, text=True)
        
        if result.stdout:
            print(f"✅ Output: {result.stdout.strip()}")
        
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"❌ Error details: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_docker():
    """Kiểm tra Docker có đang chạy không"""
    print_step(1, "Kiểm tra Docker")
    
    try:
        run_command("docker --version", "Kiểm tra Docker version")
        run_command("docker info", "Kiểm tra Docker daemon")
        print("✅ Docker đang chạy bình thường")
    except:
        print("❌ Docker không chạy. Vui lòng khởi động Docker Desktop!")
        sys.exit(1)

def build_image():
    """Build Docker image"""
    print_step(2, "Build Docker Image")
    
    # Tạo timestamp tag
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Chuyển vào thư mục backend
    os.chdir("backend")
    
    # Build image với multiple tags
    build_cmd = f"""docker build -f Dockerfile.production \
        -t {DOCKER_USERNAME}/{IMAGE_NAME}:latest \
        -t {DOCKER_USERNAME}/{IMAGE_NAME}:{timestamp} \
        ."""
    
    run_command(build_cmd, f"Building image với tags: latest, {timestamp}")
    
    # Hiển thị thông tin image
    run_command(f"docker images | grep {DOCKER_USERNAME}/{IMAGE_NAME}", 
                "Kiểm tra images đã build")
    
    return timestamp

def push_image():
    """Push image lên Docker Hub"""
    print_step(3, "Push Image lên Docker Hub")
    
    # Login Docker Hub
    print("🔐 Đăng nhập Docker Hub...")
    print("Vui lòng nhập thông tin đăng nhập Docker Hub:")
    
    login_result = run_command("docker login", "Đăng nhập Docker Hub", check=False)
    
    if login_result.returncode != 0:
        print("❌ Đăng nhập thất bại!")
        sys.exit(1)
    
    # Push image
    run_command(f"docker push {DOCKER_USERNAME}/{IMAGE_NAME}:latest", 
                "Push image latest")
    
    print("✅ Image đã được push thành công!")

def deploy_to_droplet():
    """Deploy lên Digital Ocean droplet"""
    print_step(4, "Deploy lên Digital Ocean")
    
    # Tạo script deploy
    deploy_script = f"""
#!/bin/bash
set -e

echo "🚀 Starting deployment on Digital Ocean..."

# Tạo thư mục project nếu chưa có
mkdir -p /opt/question-bank
cd /opt/question-bank

# Tạo các thư mục cần thiết
mkdir -p uploads/{{questions,temp,audio,image}} output logs
chmod -R 755 uploads output logs

# Tạo docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: {DOCKER_USERNAME}/{IMAGE_NAME}:latest
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
      - JWT_SECRET=your-super-secret-jwt-key-production-2025
      - JWT_EXPIRES_IN=24h
      - STORAGE_PROVIDER=digitalocean
      - DIGITALOCEAN_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
      - DIGITALOCEAN_SPACES_KEY=DO00EXAMPLE
      - DIGITALOCEAN_SPACES_SECRET=your-spaces-secret
      - DIGITALOCEAN_SPACES_BUCKET=datauploads
      - PUBLIC_URL=http://{DROPLET_IP}:3001
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
EOF

# Pull latest image
echo "📥 Pulling latest image..."
docker pull {DOCKER_USERNAME}/{IMAGE_NAME}:latest

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start new containers
echo "🚀 Starting new containers..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 30

# Check status
echo "📊 Container status:"
docker-compose ps

# Health check
echo "🏥 Health check:"
curl -f http://localhost:3001/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"

echo "🎉 Deployment completed successfully!"
"""
    
    # Lưu script vào file tạm
    with open("/tmp/deploy_script.sh", "w") as f:
        f.write(deploy_script)
    
    # Copy script lên droplet và chạy
    scp_cmd = f"scp /tmp/deploy_script.sh {DROPLET_USER}@{DROPLET_IP}:/tmp/"
    ssh_cmd = f"ssh {DROPLET_USER}@{DROPLET_IP} 'chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh'"
    
    run_command(scp_cmd, "Copy deploy script lên droplet")
    run_command(ssh_cmd, "Chạy deploy script trên droplet")

def verify_deployment():
    """Kiểm tra deployment"""
    print_step(5, "Kiểm tra Deployment")
    
    # Kiểm tra health endpoint
    health_url = f"http://{DROPLET_IP}:3001/api/health"
    
    print(f"🏥 Kiểm tra health endpoint: {health_url}")
    
    # Đợi một chút để service khởi động
    print("⏳ Đợi service khởi động...")
    time.sleep(10)
    
    # Kiểm tra health
    health_cmd = f"curl -f {health_url}"
    result = run_command(health_cmd, "Kiểm tra health endpoint", check=False)
    
    if result.returncode == 0:
        print("✅ Deployment thành công! Ứng dụng đang chạy bình thường.")
        print(f"🌐 URL: {health_url}")
    else:
        print("❌ Health check thất bại. Kiểm tra logs:")
        log_cmd = f"ssh {DROPLET_USER}@{DROPLET_IP} 'cd /opt/question-bank && docker-compose logs --tail=20 backend'"
        run_command(log_cmd, "Xem logs backend", check=False)

def main():
    """Hàm chính"""
    print_header("Deploy Question Bank Backend to Digital Ocean")
    print("Author: Linh Dang Dev")
    print(f"Target: {DROPLET_USER}@{DROPLET_IP}")
    print(f"Image: {DOCKER_USERNAME}/{IMAGE_NAME}")
    
    try:
        # Kiểm tra Docker
        check_docker()
        
        # Build image
        timestamp = build_image()
        
        # Push image
        push_image()
        
        # Deploy lên droplet
        deploy_to_droplet()
        
        # Verify deployment
        verify_deployment()
        
        print_header("🎉 DEPLOYMENT HOÀN THÀNH!")
        print(f"✅ Image: {DOCKER_USERNAME}/{IMAGE_NAME}:latest")
        print(f"✅ Timestamp: {timestamp}")
        print(f"✅ URL: http://{DROPLET_IP}:3001")
        print(f"✅ Health: http://{DROPLET_IP}:3001/api/health")
        
    except KeyboardInterrupt:
        print("\n❌ Deployment bị hủy bởi người dùng")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Deployment thất bại: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
