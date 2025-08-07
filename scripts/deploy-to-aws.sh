#!/bin/bash
# AWS Deployment Script for Question Bank System
# Author: Linh Dang Dev
# Date: 2025-08-03

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
PROJECT_NAME="question-bank"
ENVIRONMENT="${ENVIRONMENT:-workshop}"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        log_error "AWS CDK is not installed"
        log_info "Install with: npm install -g aws-cdk"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        log_info "Run: aws configure"
        exit 1
    fi
    
    # Check if in correct directory
    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    export CDK_DEFAULT_REGION=$AWS_REGION
    export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
    
    log_success "Environment configured"
    log_info "Account ID: $AWS_ACCOUNT_ID"
    log_info "Region: $AWS_REGION"
}

bootstrap_cdk() {
    log_info "Bootstrapping CDK..."
    
    if ! cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION; then
        log_error "CDK bootstrap failed"
        exit 1
    fi
    
    log_success "CDK bootstrapped successfully"
}

create_ecr_repository() {
    log_info "Creating ECR repository..."
    
    REPO_NAME="$PROJECT_NAME-backend"
    
    # Check if repository exists
    if aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
        log_warning "ECR repository $REPO_NAME already exists"
    else
        aws ecr create-repository \
            --repository-name $REPO_NAME \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        
        log_success "ECR repository created: $REPO_NAME"
    fi
    
    # Get repository URI
    export ECR_REPOSITORY_URI=$(aws ecr describe-repositories \
        --repository-names $REPO_NAME \
        --region $AWS_REGION \
        --query 'repositories[0].repositoryUri' \
        --output text)
    
    log_info "Repository URI: $ECR_REPOSITORY_URI"
}

build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
    
    # Build image
    log_info "Building Docker image..."
    docker build -f backend/Dockerfile.production -t $PROJECT_NAME-backend:latest backend/
    
    # Tag for ECR
    docker tag $PROJECT_NAME-backend:latest $ECR_REPOSITORY_URI:latest
    docker tag $PROJECT_NAME-backend:latest $ECR_REPOSITORY_URI:$(git rev-parse --short HEAD)
    
    # Push to ECR
    log_info "Pushing to ECR..."
    docker push $ECR_REPOSITORY_URI:latest
    docker push $ECR_REPOSITORY_URI:$(git rev-parse --short HEAD)
    
    log_success "Docker image pushed successfully"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with CDK..."
    
    # Create CDK app directory if it doesn't exist
    if [[ ! -d "infrastructure" ]]; then
        mkdir -p infrastructure
        cd infrastructure
        
        # Initialize CDK app
        cdk init app --language typescript
        
        # Install additional dependencies
        npm install @aws-cdk/aws-ec2 @aws-cdk/aws-ecs @aws-cdk/aws-rds @aws-cdk/aws-s3 @aws-cdk/aws-cloudfront
        
        cd ..
        log_success "CDK app initialized"
    fi
    
    cd infrastructure
    
    # Deploy stacks in order
    local stacks=(
        "VpcStack"
        "SecurityGroupsStack" 
        "DatabaseStack"
        "StorageStack"
        "EcsStack"
        "MonitoringStack"
    )
    
    for stack in "${stacks[@]}"; do
        log_info "Deploying $stack..."
        if cdk deploy $stack --require-approval never; then
            log_success "$stack deployed successfully"
        else
            log_error "Failed to deploy $stack"
            exit 1
        fi
    done
    
    cd ..
}

get_deployment_outputs() {
    log_info "Getting deployment outputs..."
    
    # Get Load Balancer DNS
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name EcsStack \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text 2>/dev/null || echo "Not available")
    
    # Get Database endpoint
    DB_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name DatabaseStack \
        --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
        --output text 2>/dev/null || echo "Not available")
    
    # Get S3 bucket
    ASSETS_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name StorageStack \
        --query 'Stacks[0].Outputs[?OutputKey==`AssetsBucketName`].OutputValue' \
        --output text 2>/dev/null || echo "Not available")
    
    # Save outputs to file
    cat > deployment-outputs.json << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "region": "$AWS_REGION",
    "account_id": "$AWS_ACCOUNT_ID",
    "application_url": "http://$ALB_DNS",
    "database_endpoint": "$DB_ENDPOINT",
    "assets_bucket": "$ASSETS_BUCKET",
    "ecr_repository": "$ECR_REPOSITORY_URI"
}
EOF
    
    log_success "Deployment outputs saved to deployment-outputs.json"
}

run_health_check() {
    log_info "Running health check..."
    
    if [[ "$ALB_DNS" != "Not available" ]]; then
        local health_url="http://$ALB_DNS/api/health"
        local max_attempts=30
        local attempt=1
        
        log_info "Waiting for application to be ready..."
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f -s "$health_url" > /dev/null 2>&1; then
                log_success "Application is healthy!"
                log_info "Health check URL: $health_url"
                break
            fi
            
            log_info "Attempt $attempt/$max_attempts - waiting for application..."
            sleep 10
            ((attempt++))
        done
        
        if [[ $attempt -gt $max_attempts ]]; then
            log_warning "Health check timed out, but deployment may still be in progress"
        fi
    else
        log_warning "Load balancer DNS not available, skipping health check"
    fi
}

cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    
    # Optionally clean up resources
    # This is commented out to prevent accidental deletion
    # Uncomment if you want automatic cleanup on failure
    
    # log_warning "Cleaning up CloudFormation stacks..."
    # aws cloudformation delete-stack --stack-name EcsStack
    # aws cloudformation delete-stack --stack-name DatabaseStack
    # aws cloudformation delete-stack --stack-name VpcStack
}

print_summary() {
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "Application URL: http://$ALB_DNS"
    echo "Database Endpoint: $DB_ENDPOINT"
    echo "Assets Bucket: $ASSETS_BUCKET"
    echo "ECR Repository: $ECR_REPOSITORY_URI"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure custom domain and SSL certificate"
    echo "2. Run database migrations"
    echo "3. Upload sample data"
    echo "4. Configure monitoring alerts"
    echo ""
    echo "📖 Documentation: docs/AWS_WORKSHOP_IMPLEMENTATION_GUIDE.md"
}

main() {
    echo "🚀 AWS Deployment for Question Bank System"
    echo "=========================================="
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Run deployment steps
    check_prerequisites
    setup_environment
    bootstrap_cdk
    create_ecr_repository
    build_and_push_image
    deploy_infrastructure
    get_deployment_outputs
    run_health_check
    print_summary
    
    log_success "Deployment completed successfully! 🎉"
}

# Handle command line arguments
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "build")
        setup_environment
        create_ecr_repository
        build_and_push_image
        ;;
    "deploy")
        setup_environment
        deploy_infrastructure
        ;;
    "outputs")
        get_deployment_outputs
        ;;
    "health")
        get_deployment_outputs
        run_health_check
        ;;
    "clean")
        log_warning "This will delete all AWS resources. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            cleanup_on_error
        fi
        ;;
    *)
        main
        ;;
esac
