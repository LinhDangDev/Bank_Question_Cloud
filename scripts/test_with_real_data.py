

import requests
import json
import sys

BASE_URL = "http://localhost:3000/api/integration"

# Mã đề thi thực tế từ database (từ INSERT statement)
REAL_EXAM_IDS = [
    "B23D63BF-44F9-4CBB-948A-9EA886CE7A1F",  # GIỮA KÌ - Cơ Sở Dữ Liệu
]


def test_with_real_exam_id(exam_id):
    """Test với mã đề thi thực tế"""
    print(f"🧪 Testing với mã đề thi thực tế: {exam_id}")
    print("=" * 60)

    # Test 1: Health Check
    print("1. Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("   ✅ Health Check OK")
        else:
            print(f"   ❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health Check Exception: {e}")
        return False

    # Test 2: Exam Status
    print(f"\n2. Exam Status cho {exam_id}...")
    try:
        response = requests.get(f"{BASE_URL}/exam-status/{exam_id}")
        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                exam_data = data.get('data', {})
                print(f"   ✅ Exam Status:")
                print(f"      - Mã đề thi: {exam_data.get('maDeThi')}")
                print(f"      - Tên đề thi: {exam_data.get('tenDeThi')}")
                print(f"      - Trạng thái: {exam_data.get('trangThai')}")
                print(f"      - Đã duyệt: {exam_data.get('daDuyet')}")
                print(f"      - Số câu hỏi: {exam_data.get('soCauHoi')}")
                print(f"      - Tên môn học: {exam_data.get('tenMonHoc')}")
            else:
                print(f"   ❌ API Error: {data.get('message')}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

    # Test 3: Exam Details
    print(f"\n3. Exam Details cho {exam_id}...")
    try:
        response = requests.get(f"{BASE_URL}/exam-details/{exam_id}")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Time: {response.elapsed.total_seconds():.2f}s")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                exam_data = data.get('data', {})
                print(f"   ✅ Exam Details:")
                print(f"      - Mã đề thi: {exam_data.get('MaDeThi')}")
                print(f"      - Tên đề thi: {exam_data.get('TenDeThi')}")
                print(f"      - Ngày tạo: {exam_data.get('NgayTao')}")

                phans = exam_data.get('Phans', [])
                print(f"      - Số phần: {len(phans)}")

                total_questions = 0
                for i, phan in enumerate(phans):
                    cau_hois = phan.get('CauHois', [])
                    total_questions += len(cau_hois)
                    print(
                        f"        + Phần {i+1}: '{phan.get('TenPhan', 'N/A')}' ({len(cau_hois)} câu hỏi)")
                    print(f"          - MaPhan: {phan.get('MaPhan')}")
                    print(f"          - MaPhanCha: {phan.get('MaPhanCha')}")
                    print(
                        f"          - KieuNoiDung: {phan.get('KieuNoiDung')}")
                    print(
                        f"          - LaCauHoiNhom: {phan.get('LaCauHoiNhom')}")

                    # Hiển thị câu hỏi đầu tiên
                    if cau_hois:
                        first_q = cau_hois[0]
                        print(
                            f"          - Câu hỏi mẫu: {first_q.get('NoiDung', 'N/A')[:100]}...")
                        print(
                            f"          - Số câu trả lời: {len(first_q.get('CauTraLois', []))}")

                        # Hiển thị câu trả lời
                        # Chỉ hiển thị 2 câu trả lời đầu
                        for j, ctl in enumerate(first_q.get('CauTraLois', [])[:2]):
                            print(
                                f"            * Đáp án {j+1}: {ctl.get('NoiDung', 'N/A')[:50]}... (Đúng: {ctl.get('LaDapAn')})")

                print(f"      - Tổng số câu hỏi: {total_questions}")

                # Validate JSON structure theo yêu cầu
                print(f"\n   📋 Validation JSON Structure:")
                required_fields = ['MaDeThi', 'TenDeThi', 'NgayTao', 'Phans']
                missing_fields = [
                    field for field in required_fields if field not in exam_data]

                if missing_fields:
                    print(f"   ❌ Missing required fields: {missing_fields}")
                    return False
                else:
                    print(f"   ✅ All required fields present")

                # Validate Phans structure
                for i, phan in enumerate(phans):
                    phan_required = ['MaPhan', 'TenPhan', 'KieuNoiDung',
                                     'SoLuongCauHoi', 'LaCauHoiNhom', 'CauHois']
                    phan_missing = [
                        field for field in phan_required if field not in phan]
                    if phan_missing:
                        print(
                            f"   ❌ Phần {i+1} missing fields: {phan_missing}")
                        return False

                # Validate CauHois structure
                for i, phan in enumerate(phans):
                    for j, cau_hoi in enumerate(phan.get('CauHois', [])):
                        ch_required = ['MaCauHoi', 'NoiDung', 'CauTraLois']
                        ch_missing = [
                            field for field in ch_required if field not in cau_hoi]
                        if ch_missing:
                            print(
                                f"   ❌ Phần {i+1}, Câu hỏi {j+1} missing fields: {ch_missing}")
                            return False

                        # Validate CauTraLois structure
                        for k, ctl in enumerate(cau_hoi.get('CauTraLois', [])):
                            ctl_required = [
                                'MaCauTraLoi', 'NoiDung', 'LaDapAn']
                            ctl_missing = [
                                field for field in ctl_required if field not in ctl]
                            if ctl_missing:
                                print(
                                    f"   ❌ Phần {i+1}, Câu hỏi {j+1}, Câu trả lời {k+1} missing fields: {ctl_missing}")
                                return False

                print(f"   ✅ JSON structure validation passed!")

                # Test với yêu cầu format cụ thể
                print(f"\n   🎯 Kiểm tra format theo yêu cầu:")
                sample_format = {
                    "MaDeThi": exam_data.get('MaDeThi'),
                    "TenDeThi": exam_data.get('TenDeThi'),
                    "NgayTao": exam_data.get('NgayTao'),
                    "Phans": []
                }

                for phan in phans[:1]:  # Chỉ lấy phần đầu tiên để demo
                    phan_format = {
                        "MaPhan": phan.get('MaPhan'),
                        "MaPhanCha": phan.get('MaPhanCha'),
                        "TenPhan": phan.get('TenPhan'),
                        "KieuNoiDung": phan.get('KieuNoiDung'),
                        "NoiDung": phan.get('NoiDung', ''),
                        "SoLuongCauHoi": phan.get('SoLuongCauHoi'),
                        "LaCauHoiNhom": phan.get('LaCauHoiNhom'),
                        "CauHois": []
                    }

                    # Chỉ lấy 2 câu hỏi đầu
                    for cau_hoi in phan.get('CauHois', [])[:2]:
                        ch_format = {
                            "MaCauHoi": cau_hoi.get('MaCauHoi'),
                            "NoiDung": cau_hoi.get('NoiDung'),
                            "CauTraLois": []
                        }

                        for ctl in cau_hoi.get('CauTraLois', []):
                            ctl_format = {
                                "MaCauTraLoi": ctl.get('MaCauTraLoi'),
                                "NoiDung": ctl.get('NoiDung'),
                                "LaDapAn": ctl.get('LaDapAn')
                            }
                            ch_format["CauTraLois"].append(ctl_format)

                        phan_format["CauHois"].append(ch_format)

                    sample_format["Phans"].append(phan_format)

                print(f"   📄 Sample JSON format:")
                print(json.dumps(sample_format, indent=2, ensure_ascii=False))

                return True
            else:
                print(f"   ❌ API Error: {data.get('message')}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False


def main():
    """Main function"""
    print("🚀 INTEGRATION API TEST WITH REAL DATA")
    print("=" * 60)

    success_count = 0
    total_count = len(REAL_EXAM_IDS)

    for exam_id in REAL_EXAM_IDS:
        if test_with_real_exam_id(exam_id):
            success_count += 1
        print("\n" + "=" * 60 + "\n")

    print(f"📊 FINAL RESULTS: {success_count}/{total_count} tests passed")

    if success_count == total_count:
        print("🎉 All tests passed! Integration API is working correctly with real data.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
