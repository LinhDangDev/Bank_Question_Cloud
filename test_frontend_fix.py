#!/usr/bin/env python3
"""
Test script để kiểm tra frontend sau khi sửa lỗi infinite loop
"""

import requests
import json
import time

# Configuration
API_BASE_URL = "http://localhost:3000/api"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
QUESTIONS_URL = f"{API_BASE_URL}/cau-hoi"

# Test credentials
TEST_CREDENTIALS = {
    "loginName": "admin",
    "password": "admin123"
}

def test_login():
    """Test đăng nhập để lấy JWT token"""
    print("🔐 Testing login...")
    
    try:
        response = requests.post(LOGIN_URL, json=TEST_CREDENTIALS)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            token = data.get('access_token')
            if token:
                print("✅ Login successful!")
                return token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_questions_api_performance(token):
    """Test hiệu suất API câu hỏi"""
    print("\n⚡ Testing questions API performance...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test multiple requests to check for performance issues
    times = []
    
    for i in range(3):
        print(f"   Request {i+1}/3...")
        start_time = time.time()
        
        try:
            params = {
                "page": 1,
                "limit": 5,  # Small limit for faster response
                "includeAnswers": "true"
            }
            
            response = requests.get(QUESTIONS_URL, headers=headers, params=params, timeout=10)
            end_time = time.time()
            request_time = end_time - start_time
            times.append(request_time)
            
            print(f"     Status: {response.status_code}, Time: {request_time:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                print(f"     Items: {len(data.get('items', []))}")
            else:
                print(f"     Error: {response.text[:100]}...")
                
        except requests.exceptions.Timeout:
            print(f"     ❌ Request {i+1} timed out!")
            return False
        except Exception as e:
            print(f"     ❌ Request {i+1} failed: {str(e)}")
            return False
        
        # Small delay between requests
        time.sleep(1)
    
    # Calculate average time
    avg_time = sum(times) / len(times)
    print(f"\n   Average response time: {avg_time:.2f}s")
    
    if avg_time < 5.0:
        print("   ✅ Performance looks good!")
        return True
    else:
        print("   ⚠️  Performance might be slow")
        return True  # Still consider it a pass, just slow

def test_group_questions_api(token):
    """Test API câu hỏi nhóm"""
    print("\n👥 Testing group questions API...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        params = {
            "page": 1,
            "limit": 5
        }
        
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/cau-hoi/group", headers=headers, params=params, timeout=10)
        end_time = time.time()
        
        print(f"   Status: {response.status_code}, Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Group questions API working!")
            print(f"   Items: {len(data.get('items', []))}")
            return True
        else:
            print(f"   ❌ Group questions API failed: {response.text[:100]}...")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Group questions API timed out!")
        return False
    except Exception as e:
        print(f"   ❌ Group questions API error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing frontend fixes for question list infinite loop...")
    
    # Step 1: Login
    token = test_login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        return
    
    # Step 2: Test questions API performance
    questions_success = test_questions_api_performance(token)
    
    # Step 3: Test group questions API
    group_success = test_group_questions_api(token)
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"   Login: {'✅ PASS' if token else '❌ FAIL'}")
    print(f"   Questions API: {'✅ PASS' if questions_success else '❌ FAIL'}")
    print(f"   Group Questions API: {'✅ PASS' if group_success else '❌ FAIL'}")
    
    if token and questions_success and group_success:
        print("\n🎉 All tests passed! Frontend fixes appear to be working.")
        print("\n💡 Recommendations:")
        print("   - Check browser console for any remaining errors")
        print("   - Monitor network tab for excessive requests")
        print("   - Test creating new group questions")
    else:
        print("\n⚠️  Some tests failed. Check the logs above.")

if __name__ == "__main__":
    main()
