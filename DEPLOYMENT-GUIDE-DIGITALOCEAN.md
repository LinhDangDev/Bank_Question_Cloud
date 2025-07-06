# 🚀 Digital Ocean Deployment Guide - NestJS Backend

## 📋 Overview

This guide provides step-by-step instructions to deploy the NestJS backend application to Digital Ocean with connection to the remote SQL Server database.

## 🎯 Deployment Options

### Option 1: Digital Ocean App Platform (Recommended)
- **Pros**: Managed service, auto-scaling, built-in CI/CD, SSL certificates
- **Cons**: Less control, higher cost for high-traffic apps
- **Best for**: Quick deployment, managed infrastructure

### Option 2: Digital Ocean Droplet with Docker
- **Pros**: Full control, cost-effective, custom configurations
- **Cons**: Manual server management, security updates
- **Best for**: Custom requirements, cost optimization

---

## 🌟 Option 1: Digital Ocean App Platform Deployment

### Prerequisites
- Digital Ocean account
- GitHub/GitLab repository with your code
- Remote SQL Server accessible (103.173.226.35:1433)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab**:
```bash
git add .
git commit -m "Prepare for Digital Ocean deployment"
git push origin main
```

2. **Verify required files exist**:
- ✅ `backend/package.json`
- ✅ `backend/Dockerfile.production`
- ✅ `backend/.env.production`

### Step 2: Create App Platform Application

1. **Login to Digital Ocean Console**:
   - Go to https://cloud.digitalocean.com/
   - Navigate to "Apps" section
   - Click "Create App"

2. **Connect Repository**:
   - Choose "GitHub" or "GitLab"
   - Authorize Digital Ocean access
   - Select your repository
   - Choose branch: `main`
   - Auto-deploy: ✅ Enabled

3. **Configure Build Settings**:
   - **Source Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile.production`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Run Command**: `node dist/src/main.js`

### Step 3: Configure Environment Variables

In the App Platform dashboard, add these environment variables:

```env
# Database Configuration
DB_ENV=server
SERVER_DB_HOST=103.173.226.35
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=sa
SERVER_DB_PASSWORD=Pass123@
SERVER_DB_DATABASE=question_bank
SERVER_DB_ENCRYPT=false
SERVER_DB_TRUST_SERVER_CERTIFICATE=true

# Application Configuration
NODE_ENV=production
PORT=3001

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=24h

# File Storage
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads
```

### Step 4: Configure App Settings

1. **App Info**:
   - **Name**: `question-bank-backend`
   - **Region**: Choose closest to your users

2. **Resources**:
   - **Plan**: Basic ($5/month) or Professional ($12/month)
   - **Instance Count**: 1 (can scale later)

3. **Domains**:
   - Use provided domain: `question-bank-backend.ondigitalocean.app`
   - Or add custom domain later

### Step 5: Deploy and Verify

1. **Deploy Application**:
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)
   - Monitor build logs for errors

2. **Test Database Connection**:
```bash
# Test the deployed app
curl https://your-app-name.ondigitalocean.app/api/health
```

3. **Check Application Logs**:
   - Go to App Platform dashboard
   - Click on your app
   - View "Runtime Logs" tab

---

## 🔧 Option 2: Digital Ocean Droplet Deployment

### Step 1: Create Droplet

1. **Create New Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended)

2. **Initial Server Setup**:
```bash
# Connect to your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Create app user
adduser appuser
usermod -aG docker appuser
```

### Step 2: Deploy Application

1. **Clone Repository**:
```bash
su - appuser
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend
```

2. **Configure Environment**:
```bash
# Copy production environment
cp .env.production .env

# Edit if needed
nano .env
```

3. **Build and Run with Docker**:
```bash
# Build production image
docker build -f Dockerfile.production -t question-bank-backend .

# Run container
docker run -d \
  --name question-bank-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  question-bank-backend
```

### Step 3: Configure Reverse Proxy (Nginx)

1. **Install Nginx**:
```bash
sudo apt install nginx -y
```

2. **Configure Nginx**:
```bash
sudo nano /etc/nginx/sites-available/question-bank
```

Add this configuration:
```nginx
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
```

3. **Enable Site**:
```bash
sudo ln -s /etc/nginx/sites-available/question-bank /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Security Configuration

### Network Security Requirements

#### SQL Server Network Access
Your Digital Ocean application needs to connect to the remote SQL Server at `103.173.226.35:1433`. Ensure:

1. **SQL Server Firewall Rules**:
   - Allow inbound connections on port 1433
   - Add Digital Ocean IP ranges to allowed sources
   - Enable SQL Server Authentication

2. **Digital Ocean Network Configuration**:
   - No additional firewall rules needed for outbound connections
   - App Platform: Automatic outbound access
   - Droplet: Default outbound access enabled

#### Digital Ocean Firewall Setup (Droplet only)

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow out 1433/tcp  # Allow outbound SQL Server connections
sudo ufw enable
```

#### SQL Server Security Checklist

1. **Enable SQL Server Authentication**:
```sql
-- Run on SQL Server to enable mixed mode authentication
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE',
N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2
```

2. **Configure SQL Server Network**:
   - Enable TCP/IP protocol
   - Set port to 1433
   - Restart SQL Server service

3. **Firewall Rules on SQL Server Host**:
```bash
# Windows Firewall (run on SQL Server machine)
netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433

# Or allow specific Digital Ocean IP ranges
netsh advfirewall firewall add rule name="SQL Server DO" dir=in action=allow protocol=TCP localport=1433 remoteip=YOUR_DO_APP_IP
```

### SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Environment Variables Security

**⚠️ Important**: Never commit production credentials to Git!

1. **App Platform**: Use environment variables in dashboard
2. **Droplet**: Use `.env` files with proper permissions

```bash
# Set secure permissions on .env file
chmod 600 .env
chown appuser:appuser .env
```

---

## 🧪 Testing and Verification

### Test Database Connection

```bash
# Run the test script
cd backend
node test-production-db.js
```

### Test API Endpoints

```bash
# Health check
curl https://your-app-url/api/health

# API documentation
curl https://your-app-url/api

# Test specific endpoint
curl https://your-app-url/api/cau-hoi
```

---

## 📊 Monitoring and Maintenance

### App Platform Monitoring
- Built-in metrics dashboard
- Application logs
- Performance insights
- Auto-scaling options

### Droplet Monitoring
```bash
# Check application status
docker ps
docker logs question-bank-backend

# Monitor resources
htop
df -h
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify SQL Server is accessible from Digital Ocean
   - Check firewall rules on SQL Server
   - Confirm credentials are correct

2. **Application Won't Start**:
   - Check environment variables
   - Review application logs
   - Verify Docker image builds correctly

3. **502 Bad Gateway (Droplet)**:
   - Check if application is running on port 3001
   - Verify Nginx configuration
   - Check firewall settings

### Debug Commands

```bash
# App Platform: Check logs in dashboard
# Droplet: Check application logs
docker logs question-bank-backend -f

# Test database connection
node test-production-db.js

# Check port availability
netstat -tlnp | grep 3001
```
