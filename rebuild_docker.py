#!/usr/bin/env python3
"""
Script để rebuild và push Docker image cho NestJS backend
Khắc phục vấn đề missing express module dependency
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def run_command(command, description="", check=True):
    """Chạy command và hiển thị output"""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=check,
            capture_output=False,
            text=True
        )
        if result.returncode == 0:
            print(f"✅ {description} - THÀNH CÔNG")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - THẤT BẠI")
        print(f"Error: {e}")
        if check:
            sys.exit(1)
        return e

def check_docker():
    """Kiểm tra Docker có sẵn không"""
    try:
        result = subprocess.run(
            "docker --version", 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True
        )
        print(f"✅ Docker version: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError:
        print("❌ Docker không được cài đặt hoặc không chạy")
        return False

def main():
    print("🚀 REBUILD DOCKER IMAGE CHO NESTJS BACKEND")
    print("Khắc phục vấn đề: Cannot find module 'express'")
    print(f"Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Kiểm tra Docker
    if not check_docker():
        sys.exit(1)
    
    # Thông tin Docker Hub
    docker_username = input("\n📝 Nhập Docker Hub username (hoặc Enter để skip push): ").strip()
    image_name = "question-bank-backend"
    tag = "latest"
    
    if docker_username:
        full_image_name = f"{docker_username}/{image_name}:{tag}"
    else:
        full_image_name = f"{image_name}:{tag}"
    
    print(f"\n📦 Image name: {full_image_name}")
    
    # Chuyển đến thư mục backend
    backend_dir = "backend"
    if not os.path.exists(backend_dir):
        print(f"❌ Thư mục {backend_dir} không tồn tại")
        sys.exit(1)
    
    original_dir = os.getcwd()
    os.chdir(backend_dir)
    print(f"📁 Chuyển đến thư mục: {os.getcwd()}")
    
    try:
        # 1. Dọn dẹp Docker images cũ
        print("\n🧹 Dọn dẹp Docker images cũ...")
        run_command(
            f"docker rmi {full_image_name} || true",
            "Xóa image cũ (nếu có)",
            check=False
        )
        
        # 2. Build Docker image mới
        run_command(
            f"docker build -t {full_image_name} .",
            "Build Docker image mới với dependencies đã fix"
        )
        
        # 3. Test image locally (optional)
        print("\n🧪 Test image locally...")
        test_container = f"{image_name}-test"
        
        # Stop và remove container test cũ nếu có
        run_command(
            f"docker stop {test_container} || true",
            "Stop container test cũ",
            check=False
        )
        run_command(
            f"docker rm {test_container} || true", 
            "Remove container test cũ",
            check=False
        )
        
        # Chạy container test
        run_command(
            f"docker run -d --name {test_container} -p 3001:3001 {full_image_name}",
            "Chạy container test"
        )
        
        # Đợi container khởi động
        print("⏳ Đợi container khởi động...")
        time.sleep(10)
        
        # Kiểm tra logs
        run_command(
            f"docker logs {test_container}",
            "Kiểm tra logs container",
            check=False
        )
        
        # Kiểm tra container có chạy không
        result = subprocess.run(
            f"docker ps --filter name={test_container} --format '{{{{.Status}}}}'",
            shell=True,
            capture_output=True,
            text=True
        )
        
        if "Up" in result.stdout:
            print("✅ Container đang chạy thành công!")
        else:
            print("❌ Container không chạy được")
            run_command(
                f"docker logs {test_container}",
                "Logs chi tiết lỗi",
                check=False
            )
        
        # Dọn dẹp container test
        run_command(
            f"docker stop {test_container}",
            "Stop container test",
            check=False
        )
        run_command(
            f"docker rm {test_container}",
            "Remove container test", 
            check=False
        )
        
        # 4. Push lên Docker Hub (nếu có username)
        if docker_username:
            push_choice = input("\n📤 Push image lên Docker Hub? (y/N): ").strip().lower()
            if push_choice == 'y':
                # Login Docker Hub
                print("🔐 Đăng nhập Docker Hub...")
                run_command(
                    "docker login",
                    "Đăng nhập Docker Hub"
                )
                
                # Push image
                run_command(
                    f"docker push {full_image_name}",
                    "Push image lên Docker Hub"
                )
                
                print(f"\n✅ Image đã được push thành công!")
                print(f"📦 Image: {full_image_name}")
                print(f"🔗 Docker Hub: https://hub.docker.com/r/{docker_username}/{image_name}")
        
        # 5. Hướng dẫn deploy
        print(f"\n{'='*60}")
        print("🚀 HƯỚNG DẪN DEPLOY LÊN DIGITAL OCEAN")
        print(f"{'='*60}")
        print("1. SSH vào Digital Ocean server:")
        print("   ssh root@your-server-ip")
        print()
        print("2. Pull image mới:")
        if docker_username:
            print(f"   docker pull {full_image_name}")
        else:
            print("   (Cần push image lên Docker Hub trước)")
        print()
        print("3. Update docker-compose.yml để sử dụng image mới:")
        print("   backend:")
        if docker_username:
            print(f"     image: {full_image_name}")
        print("     # comment out build section")
        print()
        print("4. Restart services:")
        print("   docker-compose down")
        print("   docker-compose up -d")
        print()
        print("5. Kiểm tra logs:")
        print("   docker-compose logs backend")
        
    finally:
        # Quay về thư mục gốc
        os.chdir(original_dir)
    
    print(f"\n✅ HOÀN THÀNH! Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
