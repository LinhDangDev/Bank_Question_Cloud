#!/bin/bash

echo "🌊 Digital Ocean Deployment Setup"
echo "=================================="

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install it first:"
    echo "   https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if user is authenticated
if ! doctl account get &> /dev/null; then
    echo "❌ Please authenticate with Digital Ocean first:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ doctl CLI found and authenticated"

# Get user input
read -p "Enter your Spaces name (e.g., my-question-bank): " SPACES_NAME
read -p "Enter region (sgp1/nyc3/ams3/fra1): " REGION

if [ -z "$SPACES_NAME" ] || [ -z "$REGION" ]; then
    echo "❌ Spaces name and region are required"
    exit 1
fi

echo ""
echo "🚀 Creating Digital Ocean Spaces..."

# Create Spaces
echo "Creating Spaces: $SPACES_NAME in region: $REGION"
doctl spaces create "$SPACES_NAME" --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Spaces created successfully"
else
    echo "❌ Failed to create Spaces. It might already exist."
fi

echo ""
echo "🔑 Please create Spaces API Keys manually:"
echo "1. Go to: https://cloud.digitalocean.com/account/api/spaces"
echo "2. Click 'Generate New Key'"
echo "3. Copy the Access Key and Secret Key"
echo ""

read -p "Enter your Spaces Access Key: " ACCESS_KEY
read -p "Enter your Spaces Secret Key: " SECRET_KEY

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ Access Key and Secret Key are required"
    exit 1
fi

# Generate .env configuration
echo ""
echo "📝 Generating .env configuration..."

ENV_CONFIG="
# Digital Ocean Spaces Configuration
STORAGE_PROVIDER=do-spaces
DO_SPACES_ENDPOINT=${REGION}.digitaloceanspaces.com
DO_SPACES_BUCKET=${SPACES_NAME}
DO_SPACES_ACCESS_KEY=${ACCESS_KEY}
DO_SPACES_SECRET_KEY=${SECRET_KEY}
DO_SPACES_PUBLIC_URL=https://${SPACES_NAME}.${REGION}.digitaloceanspaces.com
DO_SPACES_CDN_URL=https://${SPACES_NAME}.${REGION}.cdn.digitaloceanspaces.com
"

echo "$ENV_CONFIG" >> backend/.env

echo "✅ Configuration added to backend/.env"

echo ""
echo "🎯 Next steps:"
echo "1. Enable CDN for your Spaces (optional but recommended):"
echo "   https://cloud.digitalocean.com/spaces/$SPACES_NAME"
echo ""
echo "2. Install AWS SDK dependency:"
echo "   cd backend && pnpm install aws-sdk"
echo ""
echo "3. Deploy your application:"
echo "   docker-compose up -d"
echo ""
echo "4. Test file upload:"
echo "   curl -X POST https://your-api-domain.com/api/files/upload \\"
echo "     -H \"Authorization: Bearer your-token\" \\"
echo "     -F \"file=@test-file.mp3\""
echo ""
echo "🌊 Your files will be accessible at:"
echo "   https://${SPACES_NAME}.${REGION}.digitaloceanspaces.com/folder/filename"
echo ""
echo "📊 Pricing: \$5/month for 250GB storage + 1TB bandwidth"
echo ""
echo "✅ Setup completed!"
