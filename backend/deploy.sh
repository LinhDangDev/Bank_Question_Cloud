#!/bin/bash
set -e

echo "Starting deployment process..."

# Kiểm tra package.json
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found!"
  echo "Current directory contents:"
  ls -la
  exit 1
fi

# Cài đặt dependencies
echo "Installing dependencies..."
pnpm install

# Build ứng dụng
echo "Building application..."
pnpm run build

# Tạo thư mục cần thiết
echo "Creating necessary directories..."
mkdir -p uploads/questions uploads/temp uploads/audio public

# Khởi chạy ứng dụng
echo "Starting application..."
pnpm run start:prod
