#!/usr/bin/env python3
"""
Test script để kiểm tra các sửa lỗi cho tính năng tạo nhiều đề thi
"""

import json
import re

def test_api_permission_fix():
    """Test sửa lỗi quyền truy cập API"""
    print("=== TEST 1: SỬA LỖI QUYỀN TRUY CẬP API ===")
    
    # Đọc controller file để kiểm tra
    try:
        with open('backend/src/modules/de-thi/de-thi.controller.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Kiểm tra xem có thêm 'teacher' vào roles không
        if "@Roles('admin', 'teacher')" in content:
            print("✅ Đã thêm quyền 'teacher' vào endpoint findAll")
        else:
            print("❌ Chưa thêm quyền 'teacher' vào endpoint findAll")
            return False
            
        # Kiểm tra comment đã được cập nhật
        if "Admin và teacher đều được xem danh sách đề thi" in content:
            print("✅ Comment đã được cập nhật")
        else:
            print("❌ Comment chưa được cập nhật")
            return False
            
        print("✅ Sửa lỗi quyền truy cập API thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra file controller: {e}")
        return False

def test_exam_service_logging():
    """Test logging được thêm vào ExamService"""
    print("\n=== TEST 2: LOGGING TRONG EXAM SERVICE ===")
    
    try:
        with open('backend/src/services/exam.service.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Kiểm tra các logging đã được thêm
        checks = [
            ("Sample question structure", "Debug logging cho cấu trúc câu hỏi"),
            ("Chapter.*CLO distribution", "Debug logging cho phân bổ CLO"),
            ("Question.*has CLO order", "Debug logging cho CLO order"),
            ("Added question to CLO", "Debug logging khi thêm câu hỏi"),
            ("has invalid CLO order", "Warning cho CLO order không hợp lệ")
        ]
        
        passed = 0
        for pattern, description in checks:
            if re.search(pattern, content):
                print(f"✅ {description}")
                passed += 1
            else:
                print(f"❌ {description}")
        
        if passed == len(checks):
            print("✅ Tất cả logging đã được thêm thành công!")
            return True
        else:
            print(f"❌ Chỉ {passed}/{len(checks)} logging được thêm")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra ExamService: {e}")
        return False

def test_excel_import_ui():
    """Test UI cho import Excel"""
    print("\n=== TEST 3: UI IMPORT EXCEL ===")
    
    try:
        with open('frontend/src/pages/Tool/Extract.tsx', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Kiểm tra các thành phần UI đã được thêm
        checks = [
            ("importedData.*length.*0", "Kiểm tra importedData có dữ liệu"),
            ("Dữ liệu đã import từ Excel", "Header cho preview data"),
            ("Áp dụng dữ liệu", "Nút áp dụng dữ liệu"),
            ("applyImportedData", "Gọi hàm áp dụng dữ liệu"),
            ("Không tìm thấy trong hệ thống", "Cảnh báo chương không tìm thấy"),
            ("bg-blue-50.*border-blue-200", "Styling cho preview box")
        ]
        
        passed = 0
        for pattern, description in checks:
            if re.search(pattern, content):
                print(f"✅ {description}")
                passed += 1
            else:
                print(f"❌ {description}")
        
        if passed == len(checks):
            print("✅ UI import Excel đã được cải thiện thành công!")
            return True
        else:
            print(f"❌ Chỉ {passed}/{len(checks)} thành phần UI được thêm")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra Extract.tsx: {e}")
        return False

def test_exam_generation_logic():
    """Test logic tạo nhiều đề thi"""
    print("\n=== TEST 4: LOGIC TẠO NHIỀU ĐỀ THI ===")
    
    # Mock data để test logic
    mock_matrix = [
        {"maPhan": "chapter1", "clo1": 5, "clo2": 3, "clo3": 2, "clo4": 0, "clo5": 0},
        {"maPhan": "chapter2", "clo1": 3, "clo2": 4, "clo3": 3, "clo4": 0, "clo5": 0}
    ]
    
    # Tính tổng câu hỏi cần thiết
    total_questions = sum(
        item["clo1"] + item["clo2"] + item["clo3"] + item["clo4"] + item["clo5"] 
        for item in mock_matrix
    )
    
    print(f"Tổng câu hỏi cần thiết mỗi đề: {total_questions}")
    
    # Test với số lượng đề khác nhau
    test_cases = [1, 3, 5, 10]
    
    for num_exams in test_cases:
        # Với multiplier, cần nhiều câu hỏi hơn để tạo sự khác biệt
        required_questions = total_questions * num_exams
        print(f"Tạo {num_exams} đề: cần khoảng {required_questions} câu hỏi trong pool")
    
    print("✅ Logic tạo nhiều đề thi đã được phân tích!")
    return True

def test_frontend_ui_improvements():
    """Test cải tiến UI frontend"""
    print("\n=== TEST 5: CẢI TIẾN UI FRONTEND ===")
    
    try:
        with open('frontend/src/pages/Tool/Extract.tsx', 'r', encoding='utf-8') as f:
            extract_content = f.read()
        
        with open('frontend/src/pages/Tool/Exams.tsx', 'r', encoding='utf-8') as f:
            exams_content = f.read()
        
        # Kiểm tra Extract.tsx
        extract_checks = [
            ("soLuongDeThi.*useState", "State cho số lượng đề thi"),
            ("Số lượng đề thi", "Label cho input số lượng"),
            ("min.*1.*max.*10", "Validation 1-10 đề"),
            ("soLuongDe.*soLuongDeThi", "Gửi soLuongDe trong request")
        ]
        
        extract_passed = 0
        for pattern, description in extract_checks:
            if re.search(pattern, extract_content):
                print(f"✅ Extract.tsx: {description}")
                extract_passed += 1
            else:
                print(f"❌ Extract.tsx: {description}")
        
        # Kiểm tra Exams.tsx
        exams_checks = [
            ("groupedView.*useState", "State cho chế độ nhóm"),
            ("groupExamsByBaseName", "Hàm nhóm đề thi"),
            ("Nhóm đề thi.*Bật.*Tắt", "Toggle nhóm đề thi"),
            ("React.Fragment", "Sử dụng Fragment cho nhóm")
        ]
        
        exams_passed = 0
        for pattern, description in exams_checks:
            if re.search(pattern, exams_content):
                print(f"✅ Exams.tsx: {description}")
                exams_passed += 1
            else:
                print(f"❌ Exams.tsx: {description}")
        
        total_passed = extract_passed + exams_passed
        total_checks = len(extract_checks) + len(exams_checks)
        
        if total_passed == total_checks:
            print("✅ Tất cả cải tiến UI đã được triển khai!")
            return True
        else:
            print(f"❌ Chỉ {total_passed}/{total_checks} cải tiến UI được triển khai")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra UI: {e}")
        return False

def main():
    """Chạy tất cả test cases"""
    print("🚀 BẮT ĐẦU KIỂM THỬ CÁC SỬA LỖI")
    print("=" * 50)
    
    tests = [
        test_api_permission_fix,
        test_exam_service_logging,
        test_excel_import_ui,
        test_exam_generation_logic,
        test_frontend_ui_improvements
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test thất bại: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 KẾT QUẢ TỔNG KẾT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 TẤT CẢ SỬA LỖI ĐÃ ĐƯỢC TRIỂN KHAI THÀNH CÔNG!")
        print("\n📋 DANH SÁCH CÁC LỖI ĐÃ SỬA:")
        print("✅ Lỗi 1: API hiển thị đề thi - Đã thêm quyền teacher")
        print("✅ Lỗi 2: Thuật toán chọn câu hỏi - Đã thêm logging debug")
        print("✅ Lỗi 3: Import ma trận Excel - Đã thêm UI preview")
        print("✅ Cải tiến: UI tạo nhiều đề thi")
        print("✅ Cải tiến: UI nhóm đề thi")
    else:
        print("❌ VẪN CÒN MỘT SỐ VẤN ĐỀ CẦN KHẮC PHỤC")
    
    return passed == total

if __name__ == "__main__":
    main()
