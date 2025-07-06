# 🔧 Hướng dẫn Debug Tính năng Tạo Nhiều Đề Thi

## 📋 Tóm tắt các lỗi đã sửa

### ✅ **Lỗi 1: API hiển thị đề thi**
**Vấn đề:** Frontend không thể lấy danh sách đề thi vì thiếu quyền truy cập
**Giải pháp:** 
- Thêm quyền `'teacher'` vào decorator `@Roles('admin', 'teacher')` trong `de-thi.controller.ts`
- Cập nhật comment để rõ ràng hơn

### ✅ **Lỗi 2: Thuật toán chọn câu hỏi** 
**Vấn đề:** Đề thi được tạo với 0 câu hỏi do lỗi mapping CLO
**Giải pháp:**
- Thêm debug logging chi tiết trong `exam.service.ts`
- Log cấu trúc câu hỏi sample để hiểu CLO mapping
- Log phân bổ CLO theo từng chương
- Warning khi CLO order không hợp lệ

### ✅ **Lỗi 3: Import ma trận Excel**
**Vấn đề:** Dữ liệu import không hiển thị trong UI
**Giải pháp:**
- Thêm UI preview cho dữ liệu đã import
- Nút "Áp dụng dữ liệu" và "Hủy bỏ"
- Hiển thị table preview với styling
- Cảnh báo cho chương không tìm thấy trong hệ thống

## 🚀 Cách kiểm tra các sửa lỗi

### 1. **Kiểm tra API hiển thị đề thi**
```bash
# Khởi động backend
cd backend && npm run start:dev

# Khởi động frontend  
cd frontend && npm run dev

# Đăng nhập với tài khoản teacher và kiểm tra trang /exams
```

### 2. **Kiểm tra thuật toán chọn câu hỏi**
```bash
# Xem log backend khi tạo đề thi
# Tìm các dòng log:
# - "Sample question structure"
# - "Chapter X CLO distribution"
# - "Question X has CLO order"
# - "Added question to CLO"
```

### 3. **Kiểm tra import Excel**
```bash
# Vào trang /extract
# Upload file Excel ma trận
# Kiểm tra xuất hiện preview box màu xanh
# Nhấn "Áp dụng dữ liệu" để merge vào ma trận
```

## 🔍 Debug tiếp theo nếu vẫn có lỗi

### **Nếu vẫn không hiển thị đề thi:**
1. Kiểm tra console browser có lỗi API không
2. Kiểm tra network tab xem response từ `/de-thi` endpoint
3. Kiểm tra token JWT có hợp lệ không
4. Kiểm tra role của user trong database

### **Nếu vẫn tạo đề thi 0 câu hỏi:**
1. Kiểm tra log backend có hiển thị "Sample question structure" không
2. Kiểm tra CLO.ThuTu có giá trị 1-5 không
3. Kiểm tra relation giữa CauHoi và CLO có được load không
4. Kiểm tra query SQL có WHERE ((0=1)) không - nếu có thì vấn đề ở logic chọn câu hỏi

### **Nếu import Excel không hoạt động:**
1. Kiểm tra file Excel có đúng format không (header row + data rows)
2. Kiểm tra console có lỗi khi parse Excel không
3. Kiểm tra tên chương trong Excel có match với database không
4. Kiểm tra state `importedData` có được set không

## 📊 Monitoring và Logging

### **Backend Logs cần theo dõi:**
```
[ExamService] Total questions loaded across all chapters: X
[ExamService] Sample question structure: MaCauHoi=..., MaCLO=..., CLO.ThuTu=...
[ExamService] Chapter X CLO distribution:
[ExamService]   CLO 1: X questions
[ExamService]   CLO 2: X questions
[ExamService] Question X has CLO order: X, CLO ID: X
[ExamService] Added question to CLO X for chapter X
[ExamService] Saved X question details for exam X
```

### **Frontend Console cần theo dõi:**
```
All exams data length: X
First 2 exams sample: [...]
Approved exams: X
Pending exams: X
```

## 🎯 Kết quả mong đợi

### **Sau khi sửa lỗi:**
1. ✅ Trang `/exams` hiển thị danh sách đề thi
2. ✅ Có thể tạo nhiều đề thi (1-10 đề) từ một ma trận
3. ✅ Mỗi đề thi có câu hỏi khác nhau và số lượng câu hỏi > 0
4. ✅ Import Excel hiển thị preview và có thể áp dụng dữ liệu
5. ✅ Đề thi được nhóm theo tên gốc trong danh sách

### **Performance mong đợi:**
- Tạo 1 đề thi: ~2-5 giây
- Tạo 5 đề thi: ~10-15 giây  
- Tạo 10 đề thi: ~20-30 giây

## 🔧 Troubleshooting nhanh

### **Lỗi thường gặp:**

1. **"Không tìm thấy đề thi nào"**
   - Kiểm tra quyền user (phải là admin hoặc teacher)
   - Kiểm tra API response có data không

2. **"Saved 0 question details"**
   - Kiểm tra CLO mapping trong database
   - Kiểm tra relation CauHoi -> CLO có ThuTu 1-5

3. **"Import Excel không hiển thị"**
   - Kiểm tra file Excel có header row không
   - Kiểm tra tên chương có match với database không

4. **"Tạo nhiều đề thi lỗi"**
   - Kiểm tra số lượng câu hỏi trong database có đủ không
   - Với N đề thi cần khoảng N*20 câu hỏi để tạo sự khác biệt

## 📞 Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, hãy cung cấp:
1. Log backend (từ console hoặc file log)
2. Console log frontend (F12 -> Console)
3. Network requests (F12 -> Network)
4. Screenshots lỗi
5. Dữ liệu test (file Excel, thông tin đề thi)
