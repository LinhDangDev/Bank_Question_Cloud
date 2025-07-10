#!/usr/bin/env python3
"""
Test script để kiểm tra API standardization
Author: Linh Dang Dev
"""

import requests
import json
import sys
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:3000/api"
APPROVED_EXAMS_ENDPOINT = f"{BASE_URL}/multimedia-exam/approved-exams"
EXAM_DETAILS_ENDPOINT = f"{BASE_URL}/integration/exam-details"


def test_approved_exams_api():
    """Test API danh sách đề thi đã duyệt"""
    print("🔍 Testing Approved Exams API...")
    print(f"   URL: {APPROVED_EXAMS_ENDPOINT}")

    try:
        response = requests.get(APPROVED_EXAMS_ENDPOINT, timeout=10)

        if response.status_code == 200:
            data = response.json()

            # Check response structure
            if not isinstance(data, dict):
                print("   ❌ Response should be an object, not array")
                return False

            if 'success' not in data:
                print("   ❌ Missing 'success' field in response")
                return False

            if 'data' not in data:
                print("   ❌ Missing 'data' field in response")
                return False

            if not data.get('success'):
                print(
                    f"   ❌ API returned success=false: {data.get('message', 'Unknown error')}")
                return False

            exams = data.get('data', [])
            print(f"   ✅ Found {len(exams)} approved exams")

            # Check data structure for first exam
            if exams:
                first_exam = exams[0]
                required_fields = ['TenDeThi', 'MaDeThi', 'NgayTao']
                missing_fields = [
                    field for field in required_fields if field not in first_exam]

                if missing_fields:
                    print(
                        f"   ⚠️  Missing required fields in exam data: {missing_fields}")
                    return False

                print(f"   ✅ Sample exam: {first_exam.get('TenDeThi', 'N/A')}")
                print(f"      - MaDeThi: {first_exam.get('MaDeThi', 'N/A')}")
                print(f"      - NgayTao: {first_exam.get('NgayTao', 'N/A')}")
                print(f"      - KyHieuDe: {first_exam.get('KyHieuDe', 'N/A')}")

                # Check date format (should be ISO: 2025-07-08T02:42:01)
                ngay_tao = first_exam.get('NgayTao', '')
                if 'T' in ngay_tao and len(ngay_tao) == 19:
                    print(f"      ✅ Date format is correct (ISO): {ngay_tao}")
                else:
                    print(
                        f"      ⚠️  Date format may be incorrect: {ngay_tao} (expected: YYYY-MM-DDTHH:mm:ss)")

            return True

        else:
            print(f"   ❌ HTTP Error {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False


def test_exam_details_api(exam_id):
    """Test API chi tiết đề thi"""
    print(f"🔍 Testing Exam Details API for exam: {exam_id}")
    url = f"{EXAM_DETAILS_ENDPOINT}/{exam_id}"
    print(f"   URL: {url}")

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()

            # Check response structure
            if not data.get('success'):
                print(
                    f"   ❌ API returned success=false: {data.get('message', 'Unknown error')}")
                return False

            exam_data = data.get('data', {})

            # Check required fields
            required_fields = ['MaDeThi', 'TenDeThi', 'NgayTao', 'Phans']
            missing_fields = [
                field for field in required_fields if field not in exam_data]

            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                return False

            print(f"   ✅ Exam found: {exam_data.get('TenDeThi', 'N/A')}")

            # Check Phans structure
            phans = exam_data.get('Phans', [])
            print(f"   ✅ Found {len(phans)} sections (Phans)")

            if phans:
                first_phan = phans[0]

                # Check data types
                type_checks = [
                    ('KieuNoiDung', int, 'should be integer'),
                    ('SoLuongCauHoi', int, 'should be integer'),
                    ('LaCauHoiNhom', bool, 'should be boolean')
                ]

                for field, expected_type, message in type_checks:
                    if field in first_phan:
                        actual_value = first_phan[field]
                        if not isinstance(actual_value, expected_type):
                            print(
                                f"   ⚠️  {field} = {actual_value} ({type(actual_value).__name__}) - {message}")
                        else:
                            print(
                                f"   ✅ {field} = {actual_value} ({type(actual_value).__name__}) ✓")

                # Check CauHois structure
                cau_hois = first_phan.get('CauHois', [])
                if cau_hois:
                    first_cau_hoi = cau_hois[0]
                    cau_tra_lois = first_cau_hoi.get('CauTraLois', [])

                    if cau_tra_lois:
                        first_cau_tra_loi = cau_tra_lois[0]
                        la_dap_an = first_cau_tra_loi.get('LaDapAn')

                        if not isinstance(la_dap_an, bool):
                            print(
                                f"   ⚠️  CauTraLoi.LaDapAn = {la_dap_an} ({type(la_dap_an).__name__}) - should be boolean")
                        else:
                            print(
                                f"   ✅ CauTraLoi.LaDapAn = {la_dap_an} ({type(la_dap_an).__name__}) ✓")

            return True

        else:
            print(f"   ❌ HTTP Error {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False


def main():
    """Main test function"""
    print("=" * 60)
    print("🚀 API Standardization Test")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Test 1: Approved Exams API
    success1 = test_approved_exams_api()
    print()

    # Test 2: Exam Details API (if we have exams)
    success2 = True
    if success1:
        # Get first exam ID for testing
        try:
            response = requests.get(APPROVED_EXAMS_ENDPOINT, timeout=10)
            if response.status_code == 200:
                data = response.json()
                exams = data.get('data', [])
                if exams:
                    first_exam_id = exams[0].get('MaDeThi')
                    if first_exam_id:
                        success2 = test_exam_details_api(first_exam_id)
                    else:
                        print("⚠️  No exam ID found for testing details API")
                        success2 = False
                else:
                    print("⚠️  No exams found for testing details API")
                    success2 = False
        except Exception as e:
            print(f"⚠️  Could not get exam ID for testing: {e}")
            success2 = False

    print()
    print("=" * 60)
    print("📊 Test Results:")
    print(f"   Approved Exams API: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"   Exam Details API: {'✅ PASS' if success2 else '❌ FAIL'}")
    print("=" * 60)

    return success1 and success2


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
