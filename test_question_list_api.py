#!/usr/bin/env python3
"""
Test script để kiểm tra API danh sách câu hỏi sau khi tạo câu hỏi nhóm
"""

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:3000/api"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
QUESTIONS_URL = f"{API_BASE_URL}/cau-hoi"
GROUP_QUESTIONS_URL = f"{API_BASE_URL}/cau-hoi/group"

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


def test_questions_list(token):
    """Test API danh sách câu hỏi"""
    print("\n📋 Testing questions list API...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test basic questions list
    try:
        params = {
            "page": 1,
            "limit": 10,
            "includeAnswers": "true"
        }

        response = requests.get(QUESTIONS_URL, headers=headers, params=params)
        print(f"Questions list response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Questions list successful!")
            print(
                f"   Total items: {data.get('meta', {}).get('total', 'N/A')}")
            print(f"   Items returned: {len(data.get('items', []))}")
            return True
        else:
            print(f"❌ Questions list failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Questions list error: {str(e)}")
        return False


def test_group_questions_list(token):
    """Test API danh sách câu hỏi nhóm"""
    print("\n👥 Testing group questions list API...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        params = {
            "page": 1,
            "limit": 10
        }

        response = requests.get(GROUP_QUESTIONS_URL,
                                headers=headers, params=params)
        print(f"Group questions list response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Group questions list successful!")
            print(
                f"   Total items: {data.get('meta', {}).get('total', 'N/A')}")
            print(f"   Items returned: {len(data.get('items', []))}")

            # Show some details of group questions
            items = data.get('items', [])
            if items:
                print("   Recent group questions:")
                for i, item in enumerate(items[:3]):  # Show first 3
                    print(f"     {i+1}. ID: {item.get('MaCauHoi', 'N/A')}")
                    print(
                        f"        Content: {item.get('NoiDung', 'N/A')[:50]}...")
                    print(
                        f"        Child count: {item.get('SoCauHoiCon', 'N/A')}")

            return True
        else:
            print(f"❌ Group questions list failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Group questions list error: {str(e)}")
        return False


def main():
    """Main test function"""
    print("🚀 Starting API tests for question list after group question creation...")

    # Step 1: Login
    token = test_login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        return

    # Step 2: Test questions list
    questions_success = test_questions_list(token)

    # Step 3: Test group questions list
    group_questions_success = test_group_questions_list(token)

    # Summary
    print("\n📊 Test Summary:")
    print(f"   Login: {'✅ PASS' if token else '❌ FAIL'}")
    print(f"   Questions List: {'✅ PASS' if questions_success else '❌ FAIL'}")
    print(
        f"   Group Questions List: {'✅ PASS' if group_questions_success else '❌ FAIL'}")

    if token and questions_success and group_questions_success:
        print("\n🎉 All tests passed! Question list API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the logs above.")


if __name__ == "__main__":
    main()
