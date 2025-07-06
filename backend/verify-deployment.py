#!/usr/bin/env python3
"""
Digital Ocean Deployment Verification Script
Usage: python3 verify-deployment.py [app-url]
"""

import sys
import requests
import json
import time
from urllib.parse import urljoin

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_status(message):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {message}")

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")

def print_error(message):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")

def test_endpoint(base_url, endpoint, expected_status=200, timeout=10):
    """Test a specific endpoint"""
    url = urljoin(base_url, endpoint)
    try:
        print_status(f"Testing: {url}")
        response = requests.get(url, timeout=timeout)
        
        if response.status_code == expected_status:
            print_success(f"✅ {endpoint} - Status: {response.status_code}")
            return True, response
        else:
            print_warning(f"⚠️ {endpoint} - Status: {response.status_code} (expected {expected_status})")
            return False, response
            
    except requests.exceptions.RequestException as e:
        print_error(f"❌ {endpoint} - Error: {str(e)}")
        return False, None

def verify_deployment(app_url):
    """Main verification function"""
    print("=" * 60)
    print("🚀 DIGITAL OCEAN DEPLOYMENT VERIFICATION")
    print("=" * 60)
    print(f"Testing application at: {app_url}")
    print()

    # Ensure URL has proper format
    if not app_url.startswith(('http://', 'https://')):
        app_url = f"https://{app_url}"
    
    if not app_url.endswith('/'):
        app_url += '/'

    # Test cases
    tests = [
        # Basic connectivity
        ("Health Check", "api/health", 200),
        ("API Root", "api/", 200),
        ("Swagger Documentation", "api/", 200),
        
        # API endpoints (without auth)
        ("Mon Hoc List", "api/mon-hoc", 200),
        ("Chuong List", "api/chuong", 200),
        
        # Static files
        ("Uploads Directory", "uploads/", 404),  # 404 is expected for directory listing
    ]

    results = []
    
    print_status("Starting endpoint tests...")
    print()

    for test_name, endpoint, expected_status in tests:
        success, response = test_endpoint(app_url, endpoint, expected_status)
        results.append((test_name, success, response))
        time.sleep(1)  # Small delay between requests

    print()
    print("=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    passed = 0
    failed = 0

    for test_name, success, response in results:
        if success:
            print_success(f"✅ {test_name}")
            passed += 1
        else:
            print_error(f"❌ {test_name}")
            failed += 1
            if response:
                print(f"    Response: {response.status_code} - {response.text[:100]}...")

    print()
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    # Additional checks
    print()
    print("=" * 60)
    print("🔍 ADDITIONAL CHECKS")
    print("=" * 60)

    # Check if API documentation is accessible
    try:
        swagger_url = urljoin(app_url, "api/")
        response = requests.get(swagger_url, timeout=10)
        if "swagger" in response.text.lower() or "api" in response.text.lower():
            print_success("✅ API Documentation is accessible")
        else:
            print_warning("⚠️ API Documentation might not be properly configured")
    except:
        print_error("❌ Could not verify API documentation")

    # Check response headers for security
    try:
        response = requests.get(app_url, timeout=10)
        headers = response.headers
        
        security_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection'
        ]
        
        print_status("Security headers check:")
        for header in security_headers:
            if header in headers:
                print_success(f"  ✅ {header}: {headers[header]}")
            else:
                print_warning(f"  ⚠️ {header}: Not set")
                
    except:
        print_error("❌ Could not check security headers")

    # Performance check
    print()
    print_status("Performance check:")
    try:
        start_time = time.time()
        response = requests.get(urljoin(app_url, "api/health"), timeout=10)
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        if response_time < 1000:
            print_success(f"✅ Response time: {response_time:.2f}ms (Good)")
        elif response_time < 3000:
            print_warning(f"⚠️ Response time: {response_time:.2f}ms (Acceptable)")
        else:
            print_error(f"❌ Response time: {response_time:.2f}ms (Slow)")
            
    except:
        print_error("❌ Could not measure response time")

    print()
    print("=" * 60)
    print("🎯 DEPLOYMENT STATUS")
    print("=" * 60)

    if failed == 0:
        print_success("🎉 DEPLOYMENT SUCCESSFUL!")
        print("Your application is running correctly on Digital Ocean.")
        print()
        print("📋 Next Steps:")
        print("1. Update your frontend to use the new backend URL")
        print("2. Test all application features")
        print("3. Set up monitoring and alerts")
        print("4. Configure backup strategy")
        return True
    else:
        print_error("❌ DEPLOYMENT HAS ISSUES!")
        print(f"Found {failed} failed tests. Please check the logs and fix the issues.")
        print()
        print("🔧 Troubleshooting:")
        print("1. Check application logs")
        print("2. Verify environment variables")
        print("3. Test database connectivity")
        print("4. Check firewall settings")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 verify-deployment.py [app-url]")
        print("Example: python3 verify-deployment.py https://your-app.ondigitalocean.app")
        print("Example: python3 verify-deployment.py http://your-droplet-ip")
        sys.exit(1)

    app_url = sys.argv[1]
    success = verify_deployment(app_url)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
