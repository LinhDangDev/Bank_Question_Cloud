# Cải Tiến UI Upload - Chia Thành 2 Phần

**Author:** Linh Dang Dev  
**Date:** 2025-07-10

## Tổng Quan

Đã cải tiến UI trang upload câu hỏi (`UploadQuestions.tsx`) để chia thành 2 phần riêng biệt:
1. **Upload File Word** - Xử lý file Word đơn lẻ
2. **Upload Gói Đề Thi** - Xử lý file ZIP chứa Word + media files

## Các Thay Đổi Chính

### 1. UI Layout Mới
- **Grid Layout**: Chia thành 2 cột trên desktop, 1 cột trên mobile
- **Phân biệt màu sắc**: 
  - Word upload: Màu xanh dương (blue)
  - ZIP package: Màu xanh lá (green)
- **Icons riêng biệt**: FileText cho Word, Database cho ZIP

### 2. States Mới
```typescript
// New states for ZIP package upload
const [isZipLoading, setIsZipLoading] = useState(false);
const [zipError, setZipError] = useState<string | null>(null);
const [zipUploadResult, setZipUploadResult] = useState<any>(null);
```

### 3. Functions Mới
- `handleZipFileSelected()` - Xử lý chọn file ZIP
- `processZipFile()` - Xử lý upload và parse ZIP package
- Cập nhật `renderGuideContent()` - Thêm hướng dẫn cho gói đề thi

### 4. Loading States
- **Word Upload**: Hiển thị spinner và text "Đang xử lý file Word..."
- **ZIP Upload**: Hiển thị spinner và text "Đang xử lý gói đề thi..."
- **Disable interactions**: Vô hiệu hóa drag/drop và buttons khi loading

### 5. Error Handling
- **Riêng biệt error display**: Word error và ZIP error hiển thị riêng
- **Success notification**: Hiển thị thông tin thành công cho ZIP upload
- **Validation**: Kiểm tra file type và size limit

## Tính Năng Mới

### Upload File Word (Phần 1)
- Drag & drop support
- File validation (.docx, .doc)
- Loading state với spinner
- Hướng dẫn định dạng Word
- Tính năng:
  - Phân tích câu hỏi từ file Word
  - Tự động nhận diện CLO
  - Hỗ trợ LaTeX và công thức toán
  - Xử lý định dạng gạch chân (HoanVi)

### Upload Gói Đề Thi (Phần 2)
- File ZIP upload (.zip, max 100MB)
- Loading state với spinner
- Hướng dẫn cấu trúc gói đề
- Tính năng:
  - File Word (.docx) - Bắt buộc
  - Thư mục /audio - Tùy chọn
  - Thư mục /images - Tùy chọn
  - Tự động chuyển đổi WebP
  - Upload lên Digital Ocean Spaces

## API Integration

### Word Upload
- Endpoint: `/questions-import/upload`
- Method: POST
- Content-Type: multipart/form-data

### ZIP Package Upload
- Endpoint: `/exam-package/upload`
- Method: POST
- Content-Type: multipart/form-data
- Parameters:
  - `file`: ZIP file
  - `maPhan`: Chapter ID (optional)
  - `processImages`: boolean (default: true)
  - `processAudio`: boolean (default: true)
  - `saveToDatabase`: boolean (default: false)
  - `limit`: number (default: 100)

## Hướng Dẫn Sử Dụng

### 1. Upload File Word
1. Chọn khoa, môn học, chương/phần
2. Kéo thả hoặc click để chọn file Word
3. Đợi xử lý và xem preview câu hỏi
4. Chọn câu hỏi muốn import
5. Click "Lưu câu hỏi đã chọn"

### 2. Upload Gói Đề Thi
1. Chuẩn bị file ZIP với cấu trúc:
   ```
   exam-package.zip
   ├── questions.docx
   ├── audio/
   │   ├── audio1.mp3
   │   └── audio2.wav
   └── images/
       ├── image1.jpg
       └── image2.png
   ```
2. Chọn khoa, môn học, chương/phần
3. Click vào khu vực upload ZIP
4. Chọn file ZIP
5. Đợi xử lý (có thể mất vài phút)
6. Xem preview và chọn câu hỏi
7. Click "Lưu câu hỏi đã chọn"

## Cải Tiến Trong Tương Lai

1. **Drag & Drop cho ZIP**: Thêm hỗ trợ kéo thả cho file ZIP
2. **Progress Bar**: Hiển thị tiến trình upload chi tiết
3. **Batch Processing**: Xử lý nhiều file cùng lúc
4. **Preview Media**: Xem trước audio/image trong ZIP
5. **Validation Advanced**: Kiểm tra cấu trúc ZIP trước khi upload

## Files Đã Thay Đổi

- `frontend/src/pages/Questions/UploadQuestions.tsx` - Main UI component
- Không có thay đổi backend (sử dụng API có sẵn)

## Testing

Để test UI:
1. `cd frontend && pnpm run dev`
2. Truy cập `/questions/upload`
3. Test cả 2 phần upload
4. Kiểm tra loading states và error handling
