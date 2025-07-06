# WebP Converter GUI

Giao diện đồ họa (GUI) cho WebP Image Converter, giúp chuyển đổi hàng loạt file ảnh sang định dạng WebP một cách dễ dàng và trực quan.

## Tính năng GUI

### 🖥️ **Giao diện chính**
- Cửa sổ có thể resize, kích thước tối ưu 800x700
- Thiết kế thân thiện, dễ sử dụng
- Menu bar với đầy đủ chức năng
- Real-time progress tracking

### 📁 **Quản lý thư mục**
- **Chọn thư mục nguồn**: Browse để chọn folder chứa ảnh
- **Chọn thư mục đích**: Tùy chọn lưu vào thư mục khác hoặc cùng thư mục nguồn
- **Validation**: Kiểm tra tính hợp lệ của đường dẫn

### ⚙️ **Cài đặt chuyển đổi**
- **Slider chất lượng**: Điều chỉnh từ 1-100% (mặc định 85%)
- **Checkbox backup**: Tùy chọn tạo backup file gốc
- **Preview**: Xem trước danh sách file sẽ được chuyển đổi

### 📊 **Theo dõi tiến trình**
- **Progress bar**: Thanh tiến trình real-time
- **Log area**: Hiển thị chi tiết quá trình chuyển đổi
- **Statistics**: Thống kê kết quả sau khi hoàn thành

### 🎛️ **Điều khiển**
- **Start/Stop**: Bắt đầu và dừng quá trình chuyển đổi
- **Threading**: Chạy conversion trong thread riêng, không block GUI
- **Error handling**: Xử lý lỗi và hiển thị thông báo

## Cài đặt và Chạy

### Yêu cầu hệ thống
- Python 3.6+
- tkinter (có sẵn trong Python)
- Pillow (tự động cài đặt)

### Cách chạy

**Chạy GUI:**
```bash
python scripts/webp_converter_gui.py
```

**Test GUI với dữ liệu mẫu:**
```bash
python scripts/test_gui.py
```

## Hướng dẫn sử dụng

### 1. **Khởi chạy ứng dụng**
```bash
cd /path/to/project
python scripts/webp_converter_gui.py
```

### 2. **Chọn thư mục nguồn**
- Nhấn nút "Browse" bên cạnh "Thư mục nguồn"
- Chọn folder chứa các file ảnh cần chuyển đổi
- Đường dẫn sẽ hiển thị trong ô text

### 3. **Cấu hình thư mục đích**
- **Cùng thư mục nguồn**: Tick checkbox (mặc định)
- **Thư mục khác**: Bỏ tick và chọn Browse để chọn folder đích

### 4. **Điều chỉnh cài đặt**
- **Chất lượng**: Kéo slider từ 1-100%
  - 70-80%: Kích thước nhỏ, chất lượng trung bình
  - 85-90%: Cân bằng tốt (khuyến nghị)
  - 90-100%: Chất lượng cao, kích thước lớn hơn
- **Backup**: Tick để tạo backup file gốc

### 5. **Xem trước (tùy chọn)**
- Menu → Công cụ → Xem trước kết quả
- Hiển thị số lượng file và danh sách sẽ được chuyển đổi

### 6. **Bắt đầu chuyển đổi**
- Nhấn "Bắt đầu chuyển đổi"
- Theo dõi tiến trình qua progress bar
- Xem log chi tiết trong vùng text area

### 7. **Theo dõi kết quả**
- Progress bar hiển thị % hoàn thành
- Log area hiển thị từng file được xử lý
- Thống kê cuối cùng: số file, kích thước tiết kiệm

## Menu và Tính năng

### 📋 **Menu File**
- **Chọn thư mục nguồn**: Shortcut để browse source
- **Chọn thư mục đích**: Shortcut để browse destination
- **Thoát**: Đóng ứng dụng

### 🔧 **Menu Công cụ**
- **Xem trước kết quả**: Preview files sẽ được convert
- **Mở thư mục log**: Mở folder chứa log files
- **Cài đặt mặc định**: Reset về cài đặt ban đầu

### ❓ **Menu Trợ giúp**
- **Hướng dẫn sử dụng**: Chi tiết cách sử dụng
- **Về chương trình**: Thông tin phiên bản và tác giả

## Tính năng nâng cao

### 🧵 **Multi-threading**
- Conversion chạy trong thread riêng
- GUI không bị đóng băng trong quá trình chuyển đổi
- Có thể dừng quá trình bất cứ lúc nào

### 📝 **Logging System**
- Real-time log hiển thị trong GUI
- Log files được lưu tự động
- Có thể mở thư mục log từ menu

### ⚠️ **Error Handling**
- Validation input trước khi chuyển đổi
- Hiển thị thông báo lỗi rõ ràng
- Xử lý exception và recovery

### 📊 **Statistics**
- Số file được xử lý
- Tỷ lệ thành công/thất bại
- Kích thước trước và sau chuyển đổi
- Phần trăm tiết kiệm dung lượng

## Troubleshooting

### ❌ **GUI không khởi chạy**
```bash
# Kiểm tra Python và tkinter
python -c "import tkinter; print('tkinter OK')"

# Nếu lỗi, cài đặt tkinter
# Ubuntu/Debian:
sudo apt-get install python3-tk

# CentOS/RHEL:
sudo yum install tkinter
```

### ❌ **Lỗi import convert_to_webp**
- Đảm bảo file `convert_to_webp.py` ở cùng thư mục
- Kiểm tra quyền đọc file

### ❌ **Conversion không hoạt động**
- Kiểm tra Pillow đã được cài đặt
- Xem log area để biết lỗi chi tiết
- Thử với thư mục khác

### ❌ **Progress bar không cập nhật**
- Đảm bảo có file ảnh trong thư mục nguồn
- Kiểm tra định dạng file được hỗ trợ

## Keyboard Shortcuts

- **Ctrl+O**: Chọn thư mục nguồn
- **Ctrl+S**: Bắt đầu chuyển đổi
- **Ctrl+Q**: Thoát ứng dụng
- **F1**: Hiển thị trợ giúp

## Định dạng hỗ trợ

**Input formats:**
- PNG, JPG, JPEG, BMP, TIFF, TIF

**Output format:**
- WebP (với tùy chọn chất lượng)

## Performance Tips

1. **Chất lượng tối ưu**: 85% cho hầu hết trường hợp
2. **Backup**: Chỉ bật khi cần thiết để tiết kiệm thời gian
3. **Thư mục đích**: Sử dụng SSD để tăng tốc độ ghi
4. **Số lượng file**: GUI xử lý tốt với hàng nghìn file

## Tích hợp

GUI có thể được tích hợp vào các workflow khác:
- Batch processing scripts
- Image optimization pipelines  
- Web development workflows
- Content management systems

---

**Phát triển bởi**: Boss Linh Team  
**Phiên bản**: 1.0  
**Ngày cập nhật**: 2024-12-05
