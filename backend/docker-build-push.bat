@echo off
echo ========================================
echo Docker Build and Push Script for Backend
echo Author: Linh Dang Dev
echo ========================================

REM Set variables
set DOCKER_USERNAME=your-dockerhub-username
set IMAGE_NAME=question-bank-backend
set TAG=latest

echo.
echo [INFO] Building Docker image...
echo Command: docker build -f Dockerfile.production -t %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% .

docker build -f Dockerfile.production -t %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG% .

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Docker image built successfully!
echo Image: %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

echo.
echo [INFO] Logging in to Docker Hub...
echo Please enter your Docker Hub credentials when prompted.

docker login

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker login failed!
    pause
    exit /b 1
)

echo.
echo [INFO] Pushing image to Docker Hub...
echo Command: docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker push failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Image pushed successfully to Docker Hub!
echo.
echo ========================================
echo Deployment Information:
echo ========================================
echo Docker Hub Image: %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo.
echo To deploy on Digital Ocean droplet, run:
echo docker pull %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo docker run -d --name question-bank-backend -p 3001:3001 --env-file .env %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo.
echo ========================================

pause
