#!/usr/bin/env python3
"""
Script để test API tạo câu hỏi nhóm và debug lỗi 404
"""

import requests
import json
import sys

# Configuration
API_BASE_URL = "http://localhost:3000/api"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
GROUP_QUESTION_URL = f"{API_BASE_URL}/cau-hoi/group"

# Test credentials (thay đổi theo database của bạn)
TEST_CREDENTIALS = {
    "loginName": "admin",  # Hoặc username có sẵn trong database
    "password": "admin123"   # Hoặc password tương ứng
}


def test_login():
    """Test đăng nhập để lấy JWT token"""
    print("🔐 Testing login...")
    try:
        response = requests.post(LOGIN_URL, json=TEST_CREDENTIALS)
        print(f"Login Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful! Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None


def test_group_question_get(token):
    """Test GET endpoint để xem có hoạt động không"""
    print("\n📋 Testing GET group questions...")
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(GROUP_QUESTION_URL, headers=headers)
        print(f"GET Status Code: {response.status_code}")
        print(f"GET Response: {response.text[:200]}...")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ GET error: {e}")
        return False


def test_group_question_post(token):
    """Test POST endpoint để tạo câu hỏi nhóm"""
    print("\n📝 Testing POST group question...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Sample data for group question
    test_data = {
        "parentQuestion": {
            # Sử dụng MaPhan có sẵn từ database
            "MaPhan": "051b8d30-24d5-43f3-b264-d23dfe71ead4",
            "NoiDung": "Câu hỏi nhóm test",
            "HoanVi": True,
            "CapDo": 1,
            "XoaTamCauHoi": False,
            "SoLanDuocThi": 0,
            "SoLanDung": 0
        },
        "childQuestions": [
            {
                "question": {
                    "NoiDung": "Câu hỏi con 1",
                    "HoanVi": True,
                    "CapDo": 1
                },
                "answers": [
                    {
                        "NoiDung": "Đáp án A",
                        "ThuTu": 1,
                        "LaDapAn": True,
                        "HoanVi": True
                    },
                    {
                        "NoiDung": "Đáp án B",
                        "ThuTu": 2,
                        "LaDapAn": False,
                        "HoanVi": True
                    }
                ]
            }
        ]
    }

    try:
        print(f"Sending data: {json.dumps(test_data, indent=2)}")
        response = requests.post(
            GROUP_QUESTION_URL, headers=headers, json=test_data)
        print(f"POST Status Code: {response.status_code}")
        print(f"POST Response: {response.text}")

        if response.status_code == 201:
            print("✅ Group question created successfully!")
            return True
        else:
            print(f"❌ Failed to create group question")
            return False

    except Exception as e:
        print(f"❌ POST error: {e}")
        return False


def test_basic_connectivity():
    """Test basic connectivity to server"""
    print("🌐 Testing basic connectivity...")
    try:
        response = requests.get(f"{API_BASE_URL}")
        print(f"Basic connectivity Status Code: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Connectivity error: {e}")
        return False


def main():
    print("🚀 Starting API tests for Group Question endpoint...")

    # Test 1: Basic connectivity
    if not test_basic_connectivity():
        print("❌ Basic connectivity failed. Make sure backend is running on port 3000")
        return

    # Test 2: Login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without valid token")
        print("💡 Make sure you have valid credentials in the database")
        return

    # Test 3: GET group questions
    if not test_group_question_get(token):
        print("⚠️ GET endpoint has issues, but continuing with POST test...")

    # Test 4: POST group question
    test_group_question_post(token)

    print("\n🏁 Tests completed!")


if __name__ == "__main__":
    main()
