#!/bin/bash

# Digital Ocean Droplet Deployment Script
# Usage: ./deploy-droplet.sh [droplet-ip] [domain-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP=${1:-""}
DOMAIN_NAME=${2:-""}
APP_NAME="question-bank-backend"
REPO_URL="https://github.com/your-username/your-repo.git"
BRANCH="main"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$DROPLET_IP" ]; then
    print_error "Please provide droplet IP address"
    echo "Usage: ./deploy-droplet.sh [droplet-ip] [domain-name]"
    exit 1
fi

print_status "Starting deployment to Digital Ocean Droplet: $DROPLET_IP"

# Check if we can connect to the droplet
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes root@$DROPLET_IP exit 2>/dev/null; then
    print_error "Cannot connect to droplet. Please check:"
    echo "1. Droplet IP is correct"
    echo "2. SSH key is configured"
    echo "3. Droplet is running"
    exit 1
fi

print_success "SSH connection successful"

# Deploy to droplet
print_status "Deploying application to droplet..."

ssh root@$DROPLET_IP << EOF
set -e

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt install docker-compose -y
fi

# Create app user if not exists
if ! id "appuser" &>/dev/null; then
    echo "Creating app user..."
    adduser --disabled-password --gecos "" appuser
    usermod -aG docker appuser
fi

# Switch to app user and deploy
sudo -u appuser bash << 'APPUSER_EOF'
cd /home/appuser

# Clone or update repository
if [ -d "$APP_NAME" ]; then
    echo "Updating existing repository..."
    cd $APP_NAME
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone $REPO_URL $APP_NAME
    cd $APP_NAME
fi

# Switch to backend directory
cd backend

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true

# Build and start new containers
echo "Building and starting containers..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for containers to be healthy
echo "Waiting for containers to be ready..."
sleep 30

# Check container status
docker-compose -f docker-compose.production.yml ps

APPUSER_EOF

# Install and configure Nginx (if not using Docker Nginx)
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt install nginx -y
    
    # Configure firewall
    ufw allow 'Nginx Full'
    ufw allow ssh
    ufw --force enable
fi

# Configure SSL if domain is provided
if [ -n "$DOMAIN_NAME" ]; then
    echo "Setting up SSL for domain: $DOMAIN_NAME"
    
    # Install Certbot
    apt install certbot python3-certbot-nginx -y
    
    # Get SSL certificate
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
fi

echo "Deployment completed successfully!"
EOF

print_success "Deployment completed!"

# Test the deployment
print_status "Testing deployment..."

if [ -n "$DOMAIN_NAME" ]; then
    TEST_URL="https://$DOMAIN_NAME/api/health"
else
    TEST_URL="http://$DROPLET_IP/api/health"
fi

sleep 10

if curl -f -s "$TEST_URL" > /dev/null; then
    print_success "Application is responding at: $TEST_URL"
else
    print_warning "Application might not be ready yet. Please check manually:"
    echo "URL: $TEST_URL"
fi

# Display next steps
echo ""
echo "🎉 Deployment Summary:"
echo "====================="
echo "Droplet IP: $DROPLET_IP"
if [ -n "$DOMAIN_NAME" ]; then
    echo "Domain: $DOMAIN_NAME"
    echo "Application URL: https://$DOMAIN_NAME"
    echo "API Documentation: https://$DOMAIN_NAME/api"
else
    echo "Application URL: http://$DROPLET_IP"
    echo "API Documentation: http://$DROPLET_IP/api"
fi
echo ""
echo "📋 Next Steps:"
echo "1. Test the application endpoints"
echo "2. Configure your frontend to use the new backend URL"
echo "3. Set up monitoring and backups"
echo "4. Configure custom domain (if not done already)"
echo ""
echo "🔧 Management Commands:"
echo "ssh root@$DROPLET_IP"
echo "sudo -u appuser docker-compose -f /home/appuser/$APP_NAME/backend/docker-compose.production.yml logs -f"
echo "sudo -u appuser docker-compose -f /home/appuser/$APP_NAME/backend/docker-compose.production.yml restart"
