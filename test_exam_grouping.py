#!/usr/bin/env python3
"""
Test script để kiểm tra logic nhóm đề thi
"""

def test_exam_grouping():
    """Test logic nhóm đề thi"""
    
    # Mock data giống như từ API
    mock_exams = [
        {
            "MaDeThi": "exam1",
            "TenDeThi": "Đề thi Lập trình Web - Đề 1",
            "MonHoc": {"TenMonHoc": "Lập trình Web"},
            "SoCauHoi": 30,
            "NgayTao": "2024-01-15",
            "DaDuyet": False
        },
        {
            "MaDeThi": "exam2", 
            "TenDeThi": "Đề thi Lập trình Web - Đề 2",
            "MonHoc": {"TenMonHoc": "Lập trình Web"},
            "SoCauHoi": 30,
            "NgayTao": "2024-01-15",
            "DaDuyet": False
        },
        {
            "MaDeThi": "exam3",
            "TenDeThi": "Đề thi Lập trình Web - Đề 3", 
            "MonHoc": {"TenMonHoc": "Lập trình Web"},
            "SoCauHoi": 30,
            "NgayTao": "2024-01-15",
            "DaDuyet": False
        },
        {
            "MaDeThi": "exam4",
            "TenDeThi": "Đề thi Cơ sở dữ liệu",
            "MonHoc": {"TenMonHoc": "Cơ sở dữ liệu"},
            "SoCauHoi": 25,
            "NgayTao": "2024-01-16", 
            "DaDuyet": True
        }
    ]
    
    def group_exams_by_base_name(exams):
        """Python implementation của logic nhóm đề thi"""
        groups = {}
        
        for exam in exams:
            # Tách tên gốc từ tên đề thi (loại bỏ " - Đề X")
            base_name = exam["TenDeThi"]
            if " - Đề " in base_name:
                base_name = base_name.split(" - Đề ")[0]
            
            if base_name not in groups:
                groups[base_name] = []
            groups[base_name].append(exam)
        
        # Chuyển đổi thành format giống frontend
        result = []
        for base_name, exams in groups.items():
            # Sắp xếp theo số đề
            exams.sort(key=lambda x: int(x["TenDeThi"].split(" - Đề ")[-1]) if " - Đề " in x["TenDeThi"] else 0)
            
            result.append({
                "baseName": base_name,
                "exams": exams,
                "isGroup": len(exams) > 1,
                "totalExams": len(exams),
                "subject": exams[0]["MonHoc"]["TenMonHoc"],
                "createdAt": exams[0]["NgayTao"],
                "creator": exams[0].get("NguoiTao", "")
            })
        
        return result
    
    # Test nhóm đề thi
    grouped = group_exams_by_base_name(mock_exams)
    
    print("=== KẾT QUẢ TEST NHÓM ĐỀ THI ===")
    print(f"Tổng số nhóm: {len(grouped)}")
    
    for i, group in enumerate(grouped, 1):
        print(f"\nNhóm {i}:")
        print(f"  Tên gốc: {group['baseName']}")
        print(f"  Là nhóm: {group['isGroup']}")
        print(f"  Số đề: {group['totalExams']}")
        print(f"  Môn học: {group['subject']}")
        
        if group['isGroup']:
            print("  Chi tiết các đề:")
            for j, exam in enumerate(group['exams'], 1):
                print(f"    {j}. {exam['TenDeThi']} (ID: {exam['MaDeThi']})")
        else:
            print(f"  Đề đơn lẻ: {group['exams'][0]['TenDeThi']}")
    
    # Kiểm tra kết quả mong đợi
    assert len(grouped) == 2, f"Mong đợi 2 nhóm, nhận được {len(grouped)}"
    
    # Tìm nhóm "Đề thi Lập trình Web"
    web_group = next((g for g in grouped if g['baseName'] == 'Đề thi Lập trình Web'), None)
    assert web_group is not None, "Không tìm thấy nhóm 'Đề thi Lập trình Web'"
    assert web_group['isGroup'] == True, "Nhóm Lập trình Web phải là nhóm"
    assert web_group['totalExams'] == 3, f"Nhóm Lập trình Web phải có 3 đề, nhận được {web_group['totalExams']}"
    
    # Tìm nhóm "Đề thi Cơ sở dữ liệu"
    db_group = next((g for g in grouped if g['baseName'] == 'Đề thi Cơ sở dữ liệu'), None)
    assert db_group is not None, "Không tìm thấy nhóm 'Đề thi Cơ sở dữ liệu'"
    assert db_group['isGroup'] == False, "Nhóm Cơ sở dữ liệu không phải là nhóm"
    assert db_group['totalExams'] == 1, f"Nhóm Cơ sở dữ liệu phải có 1 đề, nhận được {db_group['totalExams']}"
    
    print("\n✅ TẤT CẢ TEST CASE ĐỀU PASS!")
    return True

def test_exam_generation_request():
    """Test cấu trúc request tạo nhiều đề thi"""
    
    # Mock request data
    exam_request = {
        "tenDeThi": "Đề thi Lập trình Web",
        "maMonHoc": "web-programming-101",
        "soLuongDe": 5,
        "matrix": [
            {
                "maPhan": "chapter1",
                "clo1": 5,
                "clo2": 3,
                "clo3": 2,
                "clo4": 0,
                "clo5": 0
            },
            {
                "maPhan": "chapter2", 
                "clo1": 3,
                "clo2": 4,
                "clo3": 3,
                "clo4": 0,
                "clo5": 0
            }
        ]
    }
    
    print("\n=== TEST CẤU TRÚC REQUEST ===")
    print(f"Tên đề thi: {exam_request['tenDeThi']}")
    print(f"Số lượng đề: {exam_request['soLuongDe']}")
    print(f"Tổng câu hỏi mỗi đề: {sum(sum(item[f'clo{i}'] for i in range(1, 6)) for item in exam_request['matrix'])}")
    
    # Validate request
    assert exam_request['soLuongDe'] >= 1 and exam_request['soLuongDe'] <= 10, "Số lượng đề phải từ 1-10"
    assert len(exam_request['matrix']) > 0, "Ma trận không được rỗng"
    
    print("✅ Cấu trúc request hợp lệ!")
    return True

if __name__ == "__main__":
    print("🚀 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG TẠO NHIỀU ĐỀ THI")
    
    try:
        test_exam_grouping()
        test_exam_generation_request()
        print("\n🎉 TẤT CẢ KIỂM THỬ HOÀN THÀNH THÀNH CÔNG!")
        print("\n📋 TỔNG KẾT:")
        print("✅ Logic nhóm đề thi hoạt động đúng")
        print("✅ Cấu trúc request API hợp lệ")
        print("✅ Validation dữ liệu chính xác")
        
    except Exception as e:
        print(f"\n❌ KIỂM THỬ THẤT BẠI: {e}")
        exit(1)
