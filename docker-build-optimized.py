#!/usr/bin/env python3
"""
Optimized Docker Build Script for Question Bank Backend
Author: Linh Dang Dev
"""

import subprocess
import sys
import time
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    start_time = time.time()
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        elapsed = time.time() - start_time
        print(f"✅ {description} completed in {elapsed:.1f}s")
        return True
    except subprocess.CalledProcessError as e:
        elapsed = time.time() - start_time
        print(f"❌ {description} failed after {elapsed:.1f}s")
        print(f"Error: {e.stderr}")
        return False

def check_docker():
    """Check if Docker is running"""
    try:
        subprocess.run("docker info", shell=True, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        print("❌ Docker is not running. Please start Docker Desktop.")
        return False

def build_with_cache():
    """Build Docker image with optimizations"""
    image_name = "lighthunter15723/question-bank-backend:latest"
    
    print("🚀 Starting optimized Docker build...")
    print(f"📦 Building image: {image_name}")
    
    # Build with BuildKit and cache optimizations
    build_cmd = f"""
    DOCKER_BUILDKIT=1 docker build \
        --target production \
        --cache-from {image_name} \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --progress=plain \
        -t {image_name} \
        .
    """
    
    return run_command(build_cmd, "Docker build")

def build_with_multi_stage_cache():
    """Build with explicit cache for each stage"""
    image_name = "lighthunter15723/question-bank-backend"
    
    print("🚀 Starting multi-stage cached build...")
    
    # Build base stage
    base_cmd = f"""
    DOCKER_BUILDKIT=1 docker build \
        --target base \
        --cache-from {image_name}:base \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -t {image_name}:base \
        .
    """
    
    if not run_command(base_cmd, "Building base stage"):
        return False
    
    # Build builder stage
    builder_cmd = f"""
    DOCKER_BUILDKIT=1 docker build \
        --target builder \
        --cache-from {image_name}:base \
        --cache-from {image_name}:builder \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -t {image_name}:builder \
        .
    """
    
    if not run_command(builder_cmd, "Building builder stage"):
        return False
    
    # Build production stage
    prod_cmd = f"""
    DOCKER_BUILDKIT=1 docker build \
        --target production \
        --cache-from {image_name}:base \
        --cache-from {image_name}:builder \
        --cache-from {image_name}:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -t {image_name}:latest \
        .
    """
    
    return run_command(prod_cmd, "Building production stage")

def cleanup_build_cache():
    """Clean up Docker build cache if needed"""
    print("\n🧹 Cleaning up build cache...")
    
    # Remove dangling images
    run_command("docker image prune -f", "Removing dangling images")
    
    # Show disk usage
    run_command("docker system df", "Showing Docker disk usage")

def main():
    """Main build process"""
    print("=" * 60)
    print("🐳 Optimized Docker Build for Question Bank Backend")
    print("=" * 60)
    
    # Check Docker
    if not check_docker():
        sys.exit(1)
    
    # Check if we're in the right directory
    if not os.path.exists("Dockerfile"):
        print("❌ Dockerfile not found. Please run from project root.")
        sys.exit(1)
    
    # Start build process
    start_time = time.time()
    
    # Try optimized build first
    success = build_with_cache()
    
    if not success:
        print("\n⚠️  Standard build failed, trying multi-stage cache build...")
        success = build_with_multi_stage_cache()
    
    if success:
        total_time = time.time() - start_time
        print(f"\n🎉 Build completed successfully in {total_time:.1f}s")
        
        # Show image info
        run_command("docker images lighthunter15723/question-bank-backend:latest", "Image info")
        
        # Optional cleanup
        cleanup_choice = input("\n🧹 Clean up build cache? (y/N): ").lower()
        if cleanup_choice == 'y':
            cleanup_build_cache()
            
        print("\n✅ Ready to push or run the container!")
        print("📝 Next steps:")
        print("   - Test: docker run -p 3001:3001 lighthunter15723/question-bank-backend:latest")
        print("   - Push: docker push lighthunter15723/question-bank-backend:latest")
        
    else:
        print("\n❌ Build failed. Check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
