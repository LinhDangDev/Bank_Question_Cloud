#!/bin/bash

# Build and Deploy Script for Question Bank Backend
# Author: Linh Dang Dev

set -e  # Exit on any error

# Configuration
DOCKER_USERNAME="lighthunter15723"
IMAGE_NAME="question-bank-backend"
DROPLET_IP="167.71.221.12"
DROPLET_USER="root"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_status "Docker is running"
}

# Build Docker image
build_image() {
    print_header "🔨 Building Docker Image"
    
    # Get current timestamp for tagging
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    echo "Building image: ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo "Also tagging as: ${DOCKER_USERNAME}/${IMAGE_NAME}:${TIMESTAMP}"
    
    # Build image
    docker build -f Dockerfile \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TIMESTAMP} \
        .
    
    print_status "Image built successfully"
    
    # Show image info
    docker images | grep ${DOCKER_USERNAME}/${IMAGE_NAME}
}

# Test image locally
test_image() {
    print_header "🧪 Testing Image Locally"
    
    # Stop any existing test container
    docker stop test-backend 2>/dev/null || true
    docker rm test-backend 2>/dev/null || true
    
    # Run test container
    echo "Starting test container..."
    docker run -d \
        --name test-backend \
        -p 3002:3001 \
        -e NODE_ENV=production \
        -e DB_HOST=103.173.226.35 \
        -e DB_PORT=1433 \
        -e DB_USERNAME=sa \
        -e DB_PASSWORD=Pass123@ \
        -e DB_DATABASE=question_bank \
        -e JWT_SECRET=test-secret-key \
        ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    
    # Wait for container to start
    echo "Waiting for container to start..."
    sleep 10
    
    # Check if container is running
    if docker ps | grep test-backend > /dev/null; then
        print_status "Container is running"
        
        # Test health endpoint
        echo "Testing health endpoint..."
        if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
            print_status "Health check passed"
        else
            print_warning "Health check failed, but container is running"
        fi
        
        # Show logs
        echo "Container logs:"
        docker logs test-backend --tail=20
        
    else
        print_error "Container failed to start"
        docker logs test-backend
        exit 1
    fi
    
    # Cleanup
    docker stop test-backend
    docker rm test-backend
    print_status "Test completed and cleaned up"
}

# Push to Docker Hub
push_image() {
    print_header "📤 Pushing to Docker Hub"
    
    # Check if logged in
    if ! docker info | grep Username > /dev/null 2>&1; then
        echo "Please login to Docker Hub:"
        docker login
    fi
    
    # Push latest tag
    echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:latest..."
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    
    # Push timestamp tag if exists
    if docker images | grep ${DOCKER_USERNAME}/${IMAGE_NAME} | grep $(date +%Y%m%d) > /dev/null; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:${TIMESTAMP}..."
        docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TIMESTAMP}
    fi
    
    print_status "Images pushed successfully"
}

# Deploy to Digital Ocean
deploy_to_droplet() {
    print_header "🚀 Deploying to Digital Ocean"
    
    echo "Connecting to droplet: ${DROPLET_USER}@${DROPLET_IP}"
    
    # Create deployment script
    cat > deploy_script.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Starting deployment..."

# Navigate to app directory
cd /opt/question-bank || {
    echo "Creating app directory..."
    mkdir -p /opt/question-bank
    cd /opt/question-bank
}

# Create docker-compose.yml if not exists
if [ ! -f docker-compose.yml ]; then
    echo "Creating docker-compose.yml..."
    cat > docker-compose.yml << 'COMPOSE_EOF'
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
      - DIGITALOCEAN_SPACES_KEY=DO00WJMZPVHQJXBQVJHM
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
COMPOSE_EOF
fi

# Create necessary directories
mkdir -p uploads/{questions,temp,audio,image} output logs
chmod -R 755 uploads output logs

# Pull latest image
echo "Pulling latest image..."
docker pull lighthunter15723/question-bank-backend:latest

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 30

# Check status
echo "Container status:"
docker-compose ps

# Check logs
echo "Recent logs:"
docker-compose logs --tail=20 backend

echo "✅ Deployment completed!"
echo "API should be available at: http://167.71.221.12:3001"
EOF

    # Copy and execute deployment script
    scp deploy_script.sh ${DROPLET_USER}@${DROPLET_IP}:/tmp/
    ssh ${DROPLET_USER}@${DROPLET_IP} "chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh"
    
    # Cleanup
    rm deploy_script.sh
    
    print_status "Deployment completed"
    echo ""
    echo "🌐 Your API is now available at: http://${DROPLET_IP}:3001"
    echo "🔍 Health check: http://${DROPLET_IP}:3001/api/health"
}

# Check deployment status
check_deployment() {
    print_header "🔍 Checking Deployment Status"
    
    echo "Checking API health..."
    if curl -f http://${DROPLET_IP}:3001/api/health > /dev/null 2>&1; then
        print_status "API is healthy and responding"
    else
        print_warning "API health check failed"
    fi
    
    echo ""
    echo "Checking container status on droplet..."
    ssh ${DROPLET_USER}@${DROPLET_IP} "cd /opt/question-bank && docker-compose ps"
}

# Main menu
show_menu() {
    echo ""
    print_header "🐳 Question Bank Deployment Tool"
    echo ""
    echo "1. Build Docker image"
    echo "2. Test image locally"
    echo "3. Push to Docker Hub"
    echo "4. Deploy to Digital Ocean"
    echo "5. Check deployment status"
    echo "6. Full deployment (build + push + deploy)"
    echo "7. Exit"
    echo ""
    read -p "Choose an option (1-7): " choice
}

# Main execution
main() {
    check_docker
    
    while true; do
        show_menu
        
        case $choice in
            1)
                build_image
                ;;
            2)
                test_image
                ;;
            3)
                push_image
                ;;
            4)
                deploy_to_droplet
                ;;
            5)
                check_deployment
                ;;
            6)
                build_image
                test_image
                push_image
                deploy_to_droplet
                check_deployment
                ;;
            7)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
