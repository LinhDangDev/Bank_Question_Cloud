

import requests
import json
import sys
import time
from typing import Dict, Any, Optional


class IntegrationAPITester:
    def __init__(self, base_url: str = "http://localhost:3000/api/integration"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Integration-API-Tester/1.0'
        })

    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        print("🔍 Testing Health Check...")
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)

            print(f"   Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"   Message: {data.get('message', 'N/A')}")
                print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                print(f"   Version: {data.get('version', 'N/A')}")
                return True
            else:
                print(f"   ❌ Failed: {response.text}")
                return False

        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False

    def test_exam_status(self, exam_id: str) -> bool:
        """Test exam status endpoint"""
        print(f"🔍 Testing Exam Status for ID: {exam_id}")
        try:
            response = self.session.get(
                f"{self.base_url}/exam-status/{exam_id}", timeout=10)

            print(f"   Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    exam_data = data.get('data', {})
                    print(f"   ✅ Exam Found:")
                    print(
                        f"      - Mã đề thi: {exam_data.get('maDeThi', 'N/A')}")
                    print(
                        f"      - Tên đề thi: {exam_data.get('tenDeThi', 'N/A')}")
                    print(
                        f"      - Trạng thái: {exam_data.get('trangThai', 'N/A')}")
                    print(
                        f"      - Đã duyệt: {exam_data.get('daDuyet', 'N/A')}")
                    print(
                        f"      - Số câu hỏi: {exam_data.get('soCauHoi', 'N/A')}")
                    print(
                        f"      - Tên môn học: {exam_data.get('tenMonHoc', 'N/A')}")
                    return True
                else:
                    print(
                        f"   ❌ API returned success=false: {data.get('message', 'Unknown error')}")
                    return False
            else:
                error_data = response.json() if response.headers.get(
                    'content-type', '').startswith('application/json') else response.text
                print(f"   ❌ Failed: {error_data}")
                return False

        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False

    def test_exam_details(self, exam_id: str) -> bool:
        """Test exam details endpoint"""
        print(f"🔍 Testing Exam Details for ID: {exam_id}")
        try:
            start_time = time.time()
            response = self.session.get(
                f"{self.base_url}/exam-details/{exam_id}", timeout=30)
            response_time = time.time() - start_time

            print(f"   Status Code: {response.status_code}")
            print(f"   Response Time: {response_time:.2f}s")

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    exam_data = data.get('data', {})
                    print(f"   ✅ Exam Details Retrieved:")
                    print(
                        f"      - Mã đề thi: {exam_data.get('MaDeThi', 'N/A')}")
                    print(
                        f"      - Tên đề thi: {exam_data.get('TenDeThi', 'N/A')}")
                    print(
                        f"      - Ngày tạo: {exam_data.get('NgayTao', 'N/A')}")

                    phans = exam_data.get('Phans', [])
                    print(f"      - Số phần: {len(phans)}")

                    total_questions = 0
                    for i, phan in enumerate(phans):
                        cau_hois = phan.get('CauHois', [])
                        total_questions += len(cau_hois)
                        print(
                            f"        + Phần {i+1}: {phan.get('TenPhan', 'N/A')} ({len(cau_hois)} câu hỏi)")

                        # Kiểm tra format câu hỏi đầu tiên
                        if cau_hois:
                            first_question = cau_hois[0]
                            cau_tra_lois = first_question.get('CauTraLois', [])
                            print(
                                f"          - Câu hỏi mẫu: {first_question.get('NoiDung', 'N/A')[:50]}...")
                            print(
                                f"          - Số câu trả lời: {len(cau_tra_lois)}")

                    print(f"      - Tổng số câu hỏi: {total_questions}")

                    # Validate JSON structure
                    required_fields = ['MaDeThi',
                                       'TenDeThi', 'NgayTao', 'Phans']
                    missing_fields = [
                        field for field in required_fields if field not in exam_data]

                    if missing_fields:
                        print(
                            f"   ⚠️  Missing required fields: {missing_fields}")
                        return False

                    return True
                else:
                    print(
                        f"   ❌ API returned success=false: {data.get('message', 'Unknown error')}")
                    return False
            else:
                error_data = response.json() if response.headers.get(
                    'content-type', '').startswith('application/json') else response.text
                print(f"   ❌ Failed: {error_data}")
                return False

        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False

    def test_invalid_exam_id(self) -> bool:
        """Test with invalid exam ID"""
        print("🔍 Testing Invalid Exam ID...")
        try:
            response = self.session.get(
                f"{self.base_url}/exam-details/invalid-exam-id", timeout=10)

            print(f"   Status Code: {response.status_code}")

            if response.status_code == 404:
                data = response.json()
                if not data.get('success') and data.get('error') == 'EXAM_NOT_FOUND':
                    print(f"   ✅ Correctly handled invalid exam ID")
                    print(f"   Message: {data.get('message', 'N/A')}")
                    return True

            print(f"   ❌ Unexpected response: {response.json()}")
            return False

        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return False

    def run_full_test_suite(self, exam_id: Optional[str] = None):
        """Run complete test suite"""
        print("=" * 60)
        print("🚀 INTEGRATION API TEST SUITE")
        print("=" * 60)

        results = {}

        # Test 1: Health Check
        results['health'] = self.test_health_check()
        print()

        # Test 2: Invalid Exam ID
        results['invalid_id'] = self.test_invalid_exam_id()
        print()

        if exam_id:
            # Test 3: Exam Status
            results['exam_status'] = self.test_exam_status(exam_id)
            print()

            # Test 4: Exam Details
            results['exam_details'] = self.test_exam_details(exam_id)
            print()
        else:
            print("⚠️  No exam ID provided, skipping exam-specific tests")
            print("   Usage: python test_integration_api.py <exam_id>")
            print()

        # Summary
        print("=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)

        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")

        total_tests = len(results)
        passed_tests = sum(results.values())

        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")

        if passed_tests == total_tests:
            print("🎉 All tests passed! Integration API is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the API implementation.")
            return False


def main():
    """Main function"""
    exam_id = sys.argv[1] if len(sys.argv) > 1 else None

    tester = IntegrationAPITester()
    success = tester.run_full_test_suite(exam_id)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
