# Hướng Dẫn Xóa Câu Hỏi Trùng Lặp

**Author: Linh Dang Dev**

## 🎯 Mục đích

Script Python này sẽ tự động xóa câu hỏi trùng lặp trong database, chỉ giữ lại 1 câu trong mỗi nhóm trùng lặp.

## 🔧 Cài đặt

### 1. Cài đặt Python dependencies

```bash
cd backend/scripts
pip install -r requirements.txt
```

### 2. Cài đặt ODBC Driver (nếu chưa có)

**Windows:**
- Download và cài đặt "Microsoft ODBC Driver 17 for SQL Server"
- Link: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install unixodbc-dev

# CentOS/RHEL
sudo yum install unixODBC-devel

# macOS
brew install unixodbc
```

## 🚀 Cách sử dụng

### 1. Chạy script

```bash
cd backend/scripts
python3 remove_duplicate_questions.py
```

### 2. Script sẽ thực hiện

1. **🔍 Kết nối database** - Kết nối đến SQL Server
2. **📊 Tìm kiếm duplicate** - Tìm tất cả câu hỏi trùng lặp
3. **📋 Hiển thị tổng quan** - Cho bạn xem những gì sẽ bị xóa
4. **💾 Lưu backup** - Tạo file backup trước khi xóa
5. **❓ Xác nhận** - Hỏi bạn có chắc chắn muốn xóa không
6. **🗑️ Xóa duplicate** - Thực hiện xóa câu hỏi trùng lặp

## 📊 Logic xóa

### Tiêu chí giữ lại câu hỏi:

1. **Ngày tạo cũ nhất** (ưu tiên cao nhất)
2. **Số lần được thi nhiều nhất** 
3. **Số lần trả lời đúng nhiều nhất**

### Ví dụ:

```
Nhóm câu hỏi trùng lặp:
- Câu A: Tạo 2024-01-01, Thi 10 lần → ✅ GIỮ LẠI
- Câu B: Tạo 2024-02-01, Thi 5 lần  → ❌ XÓA
- Câu C: Tạo 2024-03-01, Thi 8 lần  → ❌ XÓA
```

## 🛡️ An toàn

### 1. Transaction Safety
- Sử dụng database transaction
- Nếu có lỗi sẽ tự động rollback
- Không mất dữ liệu nếu có sự cố

### 2. Backup Information
- Tự động tạo file backup JSON
- Chứa thông tin tất cả câu hỏi bị xóa
- Có thể dùng để restore nếu cần

### 3. Confirmation Required
- Script sẽ hỏi xác nhận trước khi xóa
- Hiển thị chi tiết những gì sẽ bị xóa
- Có thể hủy bỏ bất cứ lúc nào

## 📋 Output mẫu

```
🗑️ SCRIPT XÓA CÂU HỎI TRÙNG LẶP
Author: Linh Dang Dev
==================================================

✅ Kết nối database thành công!

🔍 Đang tìm kiếm câu hỏi trùng lặp...
🔍 Tìm thấy 15 nhóm câu hỏi trùng lặp

📊 TỔNG QUAN CÂU HỎI TRÙNG LẶP:
================================================================================

1. Nhóm 3 câu hỏi trùng lặp:
   📝 Nội dung: Câu hỏi về cơ sở dữ liệu quan hệ...
   📚 Số chương khác nhau: 2
   1. ✅ GIỮ LẠI
      - ID: abc-123
      - Chương: Chương 1
      - CLO: CLO1
      - Ngày tạo: 2024-01-15
      - Số lần thi: 25
   2. ❌ XÓA
      - ID: def-456
      - Chương: Chương 2
      - CLO: CLO1
      - Ngày tạo: 2024-02-10
      - Số lần thi: 10

📈 THỐNG KÊ:
   - Tổng số nhóm trùng lặp: 15
   - Nhóm trùng giữa các chương: 8
   - Tổng số câu hỏi: 45
   - Số câu sẽ giữ lại: 15
   - Số câu sẽ xóa: 30

💾 Đang lưu thông tin backup...
💾 Đã lưu thông tin backup vào: duplicate_removal_backup_20250711_143022.json

🗑️ SẼ XÓA 30 CÂU HỎI
✅ SẼ GIỮ LẠI 15 CÂU HỎI

❓ Bạn có chắc chắn muốn xóa? (yes/no): yes

🗑️ Bắt đầu xóa câu hỏi trùng lặp...
   Đã xóa 10/30 câu hỏi...
   Đã xóa 20/30 câu hỏi...
   Đã xóa 30/30 câu hỏi...

✅ HOÀN THÀNH!
   - Đã xóa: 30 câu hỏi
   - Đã giữ lại: 15 câu hỏi
✅ Thông tin backup đã được lưu: duplicate_removal_backup_20250711_143022.json

🎉 THÀNH CÔNG!
✅ Đã xóa tất cả câu hỏi trùng lặp
✅ Chỉ giữ lại 1 câu trong mỗi nhóm trùng lặp
```

## 🔧 Troubleshooting

### Lỗi kết nối database:
```
❌ Lỗi kết nối database: [Microsoft][ODBC Driver 17 for SQL Server]...
```
**Giải pháp:**
- Kiểm tra SQL Server có đang chạy không
- Kiểm tra firewall settings
- Đảm bảo ODBC Driver đã được cài đặt

### Lỗi permission:
```
❌ Lỗi khi xóa câu hỏi: The DELETE permission was denied...
```
**Giải pháp:**
- Đảm bảo user 'sa' có quyền DELETE
- Hoặc sử dụng user khác có đủ quyền

### Lỗi foreign key constraint:
```
❌ Lỗi khi xóa câu hỏi: The DELETE statement conflicted with the REFERENCE constraint...
```
**Giải pháp:**
- Script đã xử lý việc xóa related records
- Nếu vẫn lỗi, kiểm tra có constraint nào khác không

## 📁 Files được tạo

### 1. Backup file
- **Tên**: `duplicate_removal_backup_YYYYMMDD_HHMMSS.json`
- **Nội dung**: Thông tin chi tiết tất cả câu hỏi bị xóa
- **Mục đích**: Có thể dùng để restore nếu cần

### 2. Log file (nếu có lỗi)
- Script sẽ in ra console tất cả thông tin
- Có thể redirect output để lưu log: `python3 remove_duplicate_questions.py > removal_log.txt`

## ⚠️ Lưu ý quan trọng

1. **Backup database trước khi chạy script**
2. **Chạy trên môi trường test trước**
3. **Đảm bảo không có user nào đang sử dụng hệ thống**
4. **Kiểm tra kết quả sau khi chạy**

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log output
2. Kiểm tra file backup đã được tạo chưa
3. Liên hệ với thông tin chi tiết lỗi

---

**Author**: Linh Dang Dev  
**Last Updated**: 2025-07-11  
**Version**: 1.0.0
