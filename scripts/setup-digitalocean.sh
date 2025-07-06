#!/bin/bash

# 🌊 Digital Ocean Deployment Setup Script
# Thiết lập file storage cho Question Bank System trên Digital Ocean

set -e

echo "🌊 Digital Ocean Question Bank Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if running on Digital Ocean
check_digital_ocean() {
    print_header "🔍 Checking Digital Ocean environment..."
    
    if curl -s --connect-timeout 5 http://169.254.169.254/metadata/v1/id > /dev/null 2>&1; then
        print_status "Running on Digital Ocean Droplet ✅"
        DROPLET_ID=$(curl -s http://169.254.169.254/metadata/v1/id)
        DROPLET_REGION=$(curl -s http://169.254.169.254/metadata/v1/region)
        print_status "Droplet ID: $DROPLET_ID"
        print_status "Region: $DROPLET_REGION"
    else
        print_warning "Not running on Digital Ocean Droplet"
        print_warning "This script is optimized for Digital Ocean"
    fi
}

# Install required packages
install_dependencies() {
    print_header "📦 Installing dependencies..."
    
    # Update system
    sudo apt update
    
    # Install Docker if not exists
    if ! command -v docker &> /dev/null; then
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    else
        print_status "Docker already installed ✅"
    fi
    
    # Install Docker Compose if not exists
    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    else
        print_status "Docker Compose already installed ✅"
    fi
    
    # Install doctl (Digital Ocean CLI)
    if ! command -v doctl &> /dev/null; then
        print_status "Installing doctl..."
        cd ~
        wget https://github.com/digitalocean/doctl/releases/download/v1.98.0/doctl-1.98.0-linux-amd64.tar.gz
        tar xf doctl-1.98.0-linux-amd64.tar.gz
        sudo mv doctl /usr/local/bin
        rm doctl-1.98.0-linux-amd64.tar.gz
    else
        print_status "doctl already installed ✅"
    fi
}

# Setup file storage options
setup_storage() {
    print_header "💾 Setting up file storage..."
    
    echo "Choose storage option:"
    echo "1) Digital Ocean Spaces (Recommended - $5/month)"
    echo "2) Digital Ocean Block Storage ($10/month for 100GB)"
    echo "3) Local storage with backup (Free but risky)"
    
    read -p "Enter your choice (1-3): " storage_choice
    
    case $storage_choice in
        1)
            setup_spaces
            ;;
        2)
            setup_block_storage
            ;;
        3)
            setup_local_storage
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Setup Digital Ocean Spaces
setup_spaces() {
    print_header "🌊 Setting up Digital Ocean Spaces..."
    
    echo "Please create a Space in Digital Ocean Control Panel first:"
    echo "1. Go to https://cloud.digitalocean.com/spaces"
    echo "2. Create a new Space"
    echo "3. Generate API keys in API section"
    echo ""
    
    read -p "Enter your Space name: " space_name
    read -p "Enter your Space region (sgp1/nyc3/fra1/sfo3): " space_region
    read -p "Enter your Spaces access key: " spaces_key
    read -s -p "Enter your Spaces secret key: " spaces_secret
    echo ""
    
    # Create .env file
    cat > .env << EOF
# Digital Ocean Spaces Configuration
STORAGE_PROVIDER=aws-s3
AWS_REGION=$space_region
AWS_S3_BUCKET=$space_name
AWS_ACCESS_KEY_ID=$spaces_key
AWS_SECRET_ACCESS_KEY=$spaces_secret
AWS_S3_PUBLIC_URL=https://$space_name.$space_region.digitaloceanspaces.com

# Application Configuration
NODE_ENV=production
PORT=3001
PUBLIC_URL=https://$space_name.$space_region.digitaloceanspaces.com

# Database Configuration (Update these)
DB_HOST=your-database-host
DB_PORT=1433
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=question_bank

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
EOF
    
    print_status "Digital Ocean Spaces configured ✅"
    print_status "Space URL: https://$space_name.$space_region.digitaloceanspaces.com"
}

# Setup Block Storage
setup_block_storage() {
    print_header "💾 Setting up Digital Ocean Block Storage..."
    
    read -p "Enter volume name (default: question-files-volume): " volume_name
    volume_name=${volume_name:-question-files-volume}
    
    read -p "Enter volume size in GB (default: 100): " volume_size
    volume_size=${volume_size:-100}
    
    # Create volume
    print_status "Creating Block Storage volume..."
    doctl compute volume create $volume_name \
        --region $DROPLET_REGION \
        --size ${volume_size}GiB \
        --fs-type ext4
    
    # Wait for volume to be ready
    print_status "Waiting for volume to be ready..."
    sleep 10
    
    # Mount volume
    print_status "Mounting volume..."
    sudo mkdir -p /mnt/question-files
    
    # Get volume ID
    VOLUME_ID=$(doctl compute volume list --format ID,Name --no-header | grep $volume_name | awk '{print $1}')
    
    # Mount volume
    sudo mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_$volume_name /mnt/question-files
    
    # Add to fstab for persistent mounting
    echo "/dev/disk/by-id/scsi-0DO_Volume_$volume_name /mnt/question-files ext4 defaults,nofail,discard 0 0" | sudo tee -a /etc/fstab
    
    # Set permissions
    sudo chown -R $USER:$USER /mnt/question-files
    sudo chmod -R 755 /mnt/question-files
    
    # Create .env file
    cat > .env << EOF
# Local Storage with Block Storage
STORAGE_PROVIDER=local
UPLOAD_PATH=/mnt/question-files
PUBLIC_URL=https://your-domain.com

# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration (Update these)
DB_HOST=your-database-host
DB_PORT=1433
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=question_bank

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
EOF
    
    print_status "Block Storage configured ✅"
    print_status "Volume mounted at: /mnt/question-files"
}

# Setup local storage with backup
setup_local_storage() {
    print_header "📁 Setting up local storage..."
    
    # Create uploads directory
    mkdir -p ./uploads/{questions,answers,audio,images}
    
    # Create .env file
    cat > .env << EOF
# Local Storage Configuration
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads
PUBLIC_URL=https://your-domain.com

# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration (Update these)
DB_HOST=your-database-host
DB_PORT=1433
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=question_bank

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
EOF
    
    print_status "Local storage configured ✅"
    print_warning "Remember to setup regular backups!"
}

# Setup SSL and domain
setup_ssl() {
    print_header "🔒 Setting up SSL..."
    
    read -p "Enter your domain name (e.g., api.yourdomain.com): " domain_name
    
    if [ ! -z "$domain_name" ]; then
        # Install certbot
        sudo apt install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $domain_name
        
        print_status "SSL configured for $domain_name ✅"
    else
        print_warning "Skipping SSL setup"
    fi
}

# Deploy application
deploy_app() {
    print_header "🚀 Deploying application..."
    
    # Build and start containers
    docker-compose build
    docker-compose up -d
    
    print_status "Application deployed ✅"
    print_status "API running on port 3001"
    
    # Show status
    docker-compose ps
}

# Main execution
main() {
    print_header "🌊 Starting Digital Ocean setup..."
    
    check_digital_ocean
    install_dependencies
    setup_storage
    
    read -p "Setup SSL certificate? (y/n): " setup_ssl_choice
    if [ "$setup_ssl_choice" = "y" ]; then
        setup_ssl
    fi
    
    read -p "Deploy application now? (y/n): " deploy_choice
    if [ "$deploy_choice" = "y" ]; then
        deploy_app
    fi
    
    print_header "✅ Setup completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Update database configuration in .env"
    echo "2. Configure your domain DNS"
    echo "3. Test file upload functionality"
    echo "4. Setup monitoring and backups"
}

# Run main function
main "$@"
