# WebP Image Converter

Script Python để chuyển đổi tất cả các file ảnh sang định dạng WebP nhằm tối ưu hóa hiệu suất web.

## Tính năng

- ✅ Quét tất cả file ảnh trong thư mục và thư mục con
- ✅ Hỗ trợ các định dạng: PNG, JPG, JPEG, BMP, TIFF
- ✅ Giữ nguyên cấu trúc thư mục gốc
- ✅ Tùy chọn chất lượng nén (1-100%, mặc định 85%)
- ✅ Tạo backup file gốc (tùy chọn)
- ✅ Hiển thị tiến trình và thống kê kết quả
- ✅ Xử lý lỗi và logging chi tiết
- ✅ Command line interface đầy đủ
- ✅ Tự động cài đặt Pillow nếu chưa có
- ✅ Tạo log file chi tiết

## Cài đặt

Script sẽ tự động cài đặt thư viện Pillow nếu chưa có. Hoặc bạn có thể cài đặt thủ công:

```bash
pip install Pillow
```

## Sử dụng

### Cú pháp cơ bản

```bash
python convert_to_webp.py <thư_mục_nguồn> [tùy_chọn]
```

### Các tùy chọn

- `--quality, -q`: Chất lượng nén (1-100, mặc định: 85)
- `--backup, -b`: Tạo backup file gốc
- `--output, -o`: Thư mục đích (mặc định: cùng thư mục nguồn)
- `--log, -l`: File log tùy chỉnh

### Ví dụ sử dụng

1. **Chuyển đổi cơ bản:**
```bash
python convert_to_webp.py ./images
```

2. **Chuyển đổi với chất lượng cao và tạo backup:**
```bash
python convert_to_webp.py ./images --quality 90 --backup
```

3. **Chuyển đổi và lưu vào thư mục khác:**
```bash
python convert_to_webp.py ./images --output ./webp_images --quality 75
```

4. **Chuyển đổi với log file tùy chỉnh:**
```bash
python convert_to_webp.py ./images --log conversion.log --backup
```

## Cấu trúc thư mục

### Trước khi chuyển đổi:
```
images/
├── photo1.jpg
├── photo2.png
└── subfolder/
    ├── image1.jpeg
    └── image2.bmp
```

### Sau khi chuyển đổi (cùng thư mục):
```
images/
├── photo1.jpg
├── photo1.webp          # ← Mới
├── photo2.png
├── photo2.webp          # ← Mới
├── backup/              # ← Nếu dùng --backup
│   ├── photo1.jpg
│   └── photo2.png
└── subfolder/
    ├── image1.jpeg
    ├── image1.webp      # ← Mới
    ├── image2.bmp
    ├── image2.webp      # ← Mới
    └── backup/          # ← Nếu dùng --backup
        ├── image1.jpeg
        └── image2.bmp
```

### Sau khi chuyển đổi (thư mục khác):
```
webp_images/
├── photo1.webp
├── photo2.webp
└── subfolder/
    ├── image1.webp
    └── image2.webp
```

## Thống kê kết quả

Script sẽ hiển thị thống kê chi tiết:

```
============================================================
THỐNG KÊ CHUYỂN ĐỔI
============================================================
Tổng số file:        25
Đã chuyển đổi:       23
Đã bỏ qua:          1
Lỗi:                1
Kích thước trước:    15.2 MB
Kích thước sau:      8.7 MB
Tiết kiệm:          42.8%
Log file:           webp_conversion_20241205_143022.log
============================================================
```

## Log file

Script tạo log file chi tiết với thông tin:
- Thời gian bắt đầu/kết thúc
- Danh sách file được xử lý
- Lỗi và cảnh báo
- Thống kê chi tiết

## Xử lý lỗi

Script xử lý các tình huống:
- File không thể đọc được
- Định dạng ảnh không hỗ trợ
- Không đủ quyền ghi file
- Hết dung lượng đĩa
- Ngắt quá trình bằng Ctrl+C

## Lưu ý

1. **Backup**: Khuyến nghị sử dụng `--backup` cho lần đầu chạy
2. **Chất lượng**: 
   - 85-95: Chất lượng cao, kích thước lớn hơn
   - 70-85: Cân bằng tốt (khuyến nghị)
   - 50-70: Kích thước nhỏ, chất lượng thấp hơn
3. **Hiệu suất**: Script xử lý tuần tự, có thể mất thời gian với nhiều file lớn
4. **Dung lượng**: Kiểm tra dung lượng đĩa trước khi chạy với nhiều file

## Troubleshooting

### Lỗi "Pillow not found"
```bash
pip install --upgrade Pillow
```

### Lỗi quyền truy cập
- Chạy với quyền admin (Windows) hoặc sudo (Linux/Mac)
- Kiểm tra quyền đọc/ghi thư mục

### File không chuyển đổi được
- Kiểm tra log file để xem lỗi chi tiết
- Đảm bảo file không bị hỏng
- Thử với chất lượng thấp hơn

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Log file được tạo
2. Quyền truy cập thư mục
3. Dung lượng đĩa còn lại
4. Phiên bản Python (yêu cầu 3.6+)
