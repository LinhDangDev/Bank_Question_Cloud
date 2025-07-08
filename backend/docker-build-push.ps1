# Docker Build and Push Script for Backend
# Author: Linh Dang Dev

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Build and Push Script for Backend" -ForegroundColor Cyan
Write-Host "Author: Linh Dang Dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Set variables
$DOCKER_USERNAME = Read-Host "Enter your Docker Hub username"
$IMAGE_NAME = "question-bank-backend"
$TAG = "latest"

Write-Host ""
Write-Host "[INFO] Building Docker image..." -ForegroundColor Yellow
Write-Host "Command: docker build -f Dockerfile.production -t $DOCKER_USERNAME/$IMAGE_NAME`:$TAG ." -ForegroundColor Gray

try {
    docker build -f Dockerfile.production -t "$DOCKER_USERNAME/$IMAGE_NAME`:$TAG" .
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] Docker image built successfully!" -ForegroundColor Green
    Write-Host "Image: $DOCKER_USERNAME/$IMAGE_NAME`:$TAG" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Docker build failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[INFO] Logging in to Docker Hub..." -ForegroundColor Yellow
Write-Host "Please enter your Docker Hub credentials when prompted." -ForegroundColor Gray

try {
    docker login
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker login failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Docker login failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[INFO] Pushing image to Docker Hub..." -ForegroundColor Yellow
Write-Host "Command: docker push $DOCKER_USERNAME/$IMAGE_NAME`:$TAG" -ForegroundColor Gray

try {
    docker push "$DOCKER_USERNAME/$IMAGE_NAME`:$TAG"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed with exit code $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] Image pushed successfully to Docker Hub!" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Docker push failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Information:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Hub Image: $DOCKER_USERNAME/$IMAGE_NAME`:$TAG" -ForegroundColor White
Write-Host ""
Write-Host "To deploy on Digital Ocean droplet, run:" -ForegroundColor Yellow
Write-Host "docker pull $DOCKER_USERNAME/$IMAGE_NAME`:$TAG" -ForegroundColor Gray
Write-Host "docker run -d --name question-bank-backend -p 3001:3001 --env-file .env $DOCKER_USERNAME/$IMAGE_NAME`:$TAG" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
