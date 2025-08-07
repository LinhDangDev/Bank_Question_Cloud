@echo off
setlocal enabledelayedexpansion

REM Build and Deploy Script for Question Bank Backend (Windows)
REM Author: Linh Dang Dev

REM Configuration
set DOCKER_USERNAME=lighthunter15723
set IMAGE_NAME=question-bank-backend
set DROPLET_IP=167.71.221.12
set DROPLET_USER=root

echo ========================================
echo   Question Bank Deployment Tool
echo ========================================
echo.

:menu
echo 1. Build Docker image
echo 2. Test image locally
echo 3. Push to Docker Hub
echo 4. Deploy to Digital Ocean
echo 5. Check deployment status
echo 6. Full deployment (build + push + deploy)
echo 7. Exit
echo.
set /p choice="Choose an option (1-7): "

if "%choice%"=="1" goto build_image
if "%choice%"=="2" goto test_image
if "%choice%"=="3" goto push_image
if "%choice%"=="4" goto deploy_to_droplet
if "%choice%"=="5" goto check_deployment
if "%choice%"=="6" goto full_deployment
if "%choice%"=="7" goto exit
goto invalid_choice

:build_image
echo.
echo ========================================
echo   Building Docker Image
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    goto menu
)

echo Building image: %DOCKER_USERNAME%/%IMAGE_NAME%:latest

REM Build image
docker build -f Dockerfile -t %DOCKER_USERNAME%/%IMAGE_NAME%:latest .

if errorlevel 1 (
    echo ERROR: Failed to build image
    pause
    goto menu
)

echo SUCCESS: Image built successfully
docker images | findstr %DOCKER_USERNAME%/%IMAGE_NAME%
pause
goto menu

:test_image
echo.
echo ========================================
echo   Testing Image Locally
echo ========================================
echo.

REM Stop any existing test container
docker stop test-backend >nul 2>&1
docker rm test-backend >nul 2>&1

echo Starting test container...
docker run -d --name test-backend -p 3002:3001 -e NODE_ENV=production -e DB_HOST=103.173.226.35 -e DB_PORT=1433 -e DB_USERNAME=sa -e DB_PASSWORD=Pass123@ -e DB_DATABASE=question_bank -e JWT_SECRET=test-secret-key %DOCKER_USERNAME%/%IMAGE_NAME%:latest

if errorlevel 1 (
    echo ERROR: Failed to start test container
    pause
    goto menu
)

echo Waiting for container to start...
timeout /t 10 /nobreak >nul

REM Check if container is running
docker ps | findstr test-backend >nul
if errorlevel 1 (
    echo ERROR: Container failed to start
    docker logs test-backend
    pause
    goto menu
)

echo SUCCESS: Container is running

REM Test health endpoint
echo Testing health endpoint...
curl -f http://localhost:3002/api/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Health check failed, but container is running
) else (
    echo SUCCESS: Health check passed
)

echo Container logs:
docker logs test-backend --tail=10

REM Cleanup
docker stop test-backend >nul 2>&1
docker rm test-backend >nul 2>&1
echo Test completed and cleaned up
pause
goto menu

:push_image
echo.
echo ========================================
echo   Pushing to Docker Hub
echo ========================================
echo.

REM Check if logged in (basic check)
docker info | findstr Username >nul 2>&1
if errorlevel 1 (
    echo Please login to Docker Hub:
    docker login
    if errorlevel 1 (
        echo ERROR: Failed to login to Docker Hub
        pause
        goto menu
    )
)

echo Pushing %DOCKER_USERNAME%/%IMAGE_NAME%:latest...
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest

if errorlevel 1 (
    echo ERROR: Failed to push image
    pause
    goto menu
)

echo SUCCESS: Image pushed successfully
pause
goto menu

:deploy_to_droplet
echo.
echo ========================================
echo   Deploying to Digital Ocean
echo ========================================
echo.

echo Connecting to droplet: %DROPLET_USER%@%DROPLET_IP%

REM Create deployment script
echo Creating deployment script...
(
echo #!/bin/bash
echo set -e
echo echo "Starting deployment..."
echo cd /opt/question-bank ^|^| { mkdir -p /opt/question-bank; cd /opt/question-bank; }
echo if [ ! -f docker-compose.yml ]; then
echo   echo "Creating docker-compose.yml..."
echo   cat ^> docker-compose.yml ^<^< 'COMPOSE_EOF'
echo version: '3.8'
echo.
echo services:
echo   backend:
echo     image: lighthunter15723/question-bank-backend:latest
echo     container_name: question-bank-backend
echo     restart: unless-stopped
echo     ports:
echo       - "3001:3001"
echo     environment:
echo       - NODE_ENV=production
echo       - DB_HOST=103.173.226.35
echo       - DB_PORT=1433
echo       - DB_USERNAME=sa
echo       - DB_PASSWORD=Pass123@
echo       - DB_DATABASE=question_bank
echo       - DB_ENCRYPT=false
echo       - DB_TRUST_SERVER_CERTIFICATE=true
echo       - JWT_SECRET=your-super-secret-jwt-key-32-characters-long
echo       - JWT_EXPIRES_IN=24h
echo       - STORAGE_PROVIDER=digitalocean
echo       - PUBLIC_URL=https://datauploads.sgp1.digitaloceanspaces.com
echo     volumes:
echo       - ./uploads:/app/uploads
echo       - ./output:/app/output
echo       - ./logs:/app/logs
echo.
echo   redis:
echo     image: redis:7-alpine
echo     container_name: question-bank-redis
echo     restart: unless-stopped
echo     ports:
echo       - "6379:6379"
echo     volumes:
echo       - redis_data:/data
echo.
echo volumes:
echo   redis_data:
echo COMPOSE_EOF
echo fi
echo mkdir -p uploads/{questions,temp,audio,image} output logs
echo chmod -R 755 uploads output logs
echo echo "Pulling latest image..."
echo docker pull lighthunter15723/question-bank-backend:latest
echo echo "Stopping existing containers..."
echo docker-compose down ^|^| true
echo echo "Starting new containers..."
echo docker-compose up -d
echo echo "Waiting for containers to be ready..."
echo sleep 30
echo echo "Container status:"
echo docker-compose ps
echo echo "Deployment completed!"
) > deploy_script.sh

REM Copy and execute deployment script using SCP and SSH
echo Copying deployment script to droplet...
scp deploy_script.sh %DROPLET_USER%@%DROPLET_IP%:/tmp/

if errorlevel 1 (
    echo ERROR: Failed to copy deployment script
    echo Make sure you have SSH access to the droplet
    pause
    goto menu
)

echo Executing deployment script...
ssh %DROPLET_USER%@%DROPLET_IP% "chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh"

if errorlevel 1 (
    echo ERROR: Deployment failed
    pause
    goto menu
)

REM Cleanup
del deploy_script.sh

echo SUCCESS: Deployment completed
echo.
echo Your API is now available at: http://%DROPLET_IP%:3001
echo Health check: http://%DROPLET_IP%:3001/api/health
pause
goto menu

:check_deployment
echo.
echo ========================================
echo   Checking Deployment Status
echo ========================================
echo.

echo Checking API health...
curl -f http://%DROPLET_IP%:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: API health check failed
) else (
    echo SUCCESS: API is healthy and responding
)

echo.
echo Checking container status on droplet...
ssh %DROPLET_USER%@%DROPLET_IP% "cd /opt/question-bank && docker-compose ps"

pause
goto menu

:full_deployment
echo.
echo ========================================
echo   Full Deployment Process
echo ========================================
echo.

call :build_image
if errorlevel 1 goto menu

call :test_image
if errorlevel 1 goto menu

call :push_image
if errorlevel 1 goto menu

call :deploy_to_droplet
if errorlevel 1 goto menu

call :check_deployment
goto menu

:invalid_choice
echo ERROR: Invalid option. Please choose 1-7.
pause
goto menu

:exit
echo Goodbye!
pause
exit /b 0
