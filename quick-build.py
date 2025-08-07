#!/usr/bin/env python3
"""
Quick Docker Build Script
Author: Linh Dang Dev
"""

import subprocess
import sys
import time

def quick_build():
    """Quick build with maximum caching"""
    print("🚀 Quick Docker build starting...")
    
    cmd = """
    DOCKER_BUILDKIT=1 docker build \
        --cache-from lighthunter15723/question-bank-backend:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -t lighthunter15723/question-bank-backend:latest \
        .
    """
    
    start_time = time.time()
    
    try:
        subprocess.run(cmd, shell=True, check=True)
        elapsed = time.time() - start_time
        print(f"✅ Build completed in {elapsed:.1f}s")
        return True
    except subprocess.CalledProcessError:
        elapsed = time.time() - start_time
        print(f"❌ Build failed after {elapsed:.1f}s")
        return False

def test_container():
    """Quick test of the built container"""
    print("🧪 Testing container...")
    
    # Stop any existing container
    subprocess.run("docker stop question-bank-test 2>/dev/null", shell=True)
    subprocess.run("docker rm question-bank-test 2>/dev/null", shell=True)
    
    # Run test container
    cmd = """
    docker run -d \
        --name question-bank-test \
        -p 3001:3001 \
        lighthunter15723/question-bank-backend:latest
    """
    
    try:
        subprocess.run(cmd, shell=True, check=True)
        print("✅ Container started successfully")
        print("🌐 Test at: http://localhost:3001/api/health")
        
        # Wait a bit and check health
        time.sleep(5)
        health_check = subprocess.run(
            "curl -f http://localhost:3001/api/health", 
            shell=True, 
            capture_output=True
        )
        
        if health_check.returncode == 0:
            print("✅ Health check passed")
        else:
            print("⚠️  Health check failed - container may still be starting")
            
        # Show logs
        print("\n📋 Container logs:")
        subprocess.run("docker logs question-bank-test --tail 10", shell=True)
        
        return True
    except subprocess.CalledProcessError:
        print("❌ Container test failed")
        return False

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Build and test
        if quick_build():
            test_container()
    else:
        # Just build
        quick_build()

if __name__ == "__main__":
    main()
