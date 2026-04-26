# Tính năng Xuất Đề Thi ra Word

## Tổng quan

Tính năng cho phép xuất đề thi ra file Word với thông tin header tùy chỉnh, sử dụng template chính thức của HUTECH.

**Author**: Linh Dang Dev  
**Template**: `D:\Code\Graduation\template\TemplateHutechOffical.dotx`

## Luồng hoạt động

### 1. Frontend Flow

```
Trang chi tiết đề thi → Button "Tải Word" → Dialog popup → Form điền thông tin → Xuất file Word
```

### 2. Backend Flow

```
API nhận request → Lấy dữ liệu đề thi → Xử lý template → Tạo file Word → Trả về file
```

## Các thành phần đã tạo

### Backend

1. **ExamWordExportService** (`backend/src/modules/exam-word-export/exam-word-export.service.ts`)
   - Xử lý logic xuất Word
   - Lấy dữ liệu đề thi và câu hỏi
   - Tạo file Word từ template

2. **ExamWordExportController** (`backend/src/modules/exam-word-export/exam-word-export.controller.ts`)
   - API endpoints cho xuất Word
   - Xử lý request/response

3. **ExamWordExportModule** (`backend/src/modules/exam-word-export/exam-word-export.module.ts`)
   - Module tổng hợp các service và controller

### Frontend

1. **ExamWordExportDialog** (`frontend/src/components/ExamWordExportDialog.tsx`)
   - Component popup form
   - Tự động load thông tin mặc định
   - Xử lý xuất file

2. **API Integration** (`frontend/src/services/api.ts`)
   - `examWordExportApi` với các method cần thiết

3. **Integration vào ExamDetail** (`frontend/src/pages/Tool/ExamDetail/ExamDetail.tsx`)
   - Thay thế button "Tải Word" cũ bằng dialog mới

## API Endpoints

### 1. Lấy thông tin mặc định
```
GET /exam-word-export/:examId/default-options
```

### 2. Xem trước đề thi
```
GET /exam-word-export/:examId/preview
```

### 3. Xuất file Word
```
POST /exam-word-export/:examId/export
Body: ExportOptions
Response: File Word (.docx)
```

### 4. Lấy danh sách template
```
GET /exam-word-export/templates
```

## Cấu trúc dữ liệu

### ExportOptions
```typescript
interface ExportOptions {
    examTitle: string;           // Tiêu đề đề thi
    subject: string;            // Môn học
    course: string;             // Khoa/Lớp
    semester: string;           // Học kỳ
    academicYear: string;       // Năm học
    examDate: string;           // Ngày thi
    duration: string;           // Thời gian làm bài
    instructions: string;       // Hướng dẫn
    allowMaterials: boolean;    // Cho phép tài liệu
    showAnswers: boolean;       // Hiển thị đáp án
    separateAnswerSheet: boolean; // Tách bảng đáp án
    studentInfo: {
        studentId: string;      // Mã sinh viên
        studentName: string;    // Tên sinh viên
        className: string;      // Lớp
    };
}
```

## Template Structure

File `TemplateHutechOffical.dotx` có cấu trúc:

```
TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM
HUTECH

{examTitle} - NĂM HỌC {academicYear}
Khoa/Lớp: {course}
Môn thi: {subject}
Ngày thi: {examDate}
Thời gian làm bài: {duration}
SỬ DỤNG TÀI LIỆU: {allowMaterials} ☐ KHÔNG ☐

Họ và tên: {studentName}
Mã số sinh viên: {studentId}
Lớp: {className}

{instructions}

{#questions}
Câu {number}: {content}
{#answers}
{label}. {content}
{/answers}
{/questions}

{#answerKey}
ĐÁP ÁN:
Câu {number}: {correctAnswer}
{/answerKey}
```

## Cách sử dụng

### 1. Từ trang chi tiết đề thi

1. Vào trang chi tiết đề thi (`/exam-detail/:id`)
2. Nhấn button "Tải Word"
3. Dialog popup hiện ra với form đã điền sẵn thông tin mặc định
4. Tùy chỉnh thông tin theo nhu cầu:
   - Thông tin đề thi (tiêu đề, môn học, thời gian...)
   - Thông tin sinh viên (tùy chọn)
   - Tùy chọn xuất (có đáp án, tách bảng đáp án...)
5. Nhấn "Xuất file Word"
6. File Word sẽ được tải về tự động

### 2. Các tùy chọn xuất

- **Cơ bản**: Chỉ câu hỏi, không có đáp án
- **Kèm đáp án**: Hiển thị đáp án đúng cho mỗi câu
- **Tách bảng đáp án**: Tạo bảng đáp án riêng ở cuối đề thi

## Testing

### 1. Test backend API
```bash
cd backend
node test-exam-word-export-flow.js
```

### 2. Test frontend
1. Chạy frontend: `npm run dev`
2. Vào trang chi tiết đề thi
3. Nhấn button "Tải Word"
4. Kiểm tra dialog popup
5. Test xuất file

## Lỗi thường gặp và cách khắc phục

### 1. Template not found
```
Error: Template file not found
```
**Giải pháp**: Kiểm tra file `template/TemplateHutechOffical.dotx` có tồn tại

### 2. Exam not found
```
Error: Exam not found
```
**Giải pháp**: Kiểm tra exam ID có đúng và đề thi đã được duyệt

### 3. Database connection error
```
Error: Cannot connect to database
```
**Giải pháp**: Kiểm tra kết nối database và các entity

### 4. Frontend API error
```
Error: Failed to fetch
```
**Giải pháp**: Kiểm tra backend đang chạy và API endpoint đúng

## Tính năng mở rộng

### 1. Đã hoàn thành
- ✅ Xuất Word với template HUTECH
- ✅ Form tùy chỉnh thông tin header
- ✅ Tùy chọn hiển thị đáp án
- ✅ Tự động load thông tin mặc định
- ✅ Integration vào trang chi tiết đề thi

### 2. Có thể mở rộng
- 🔄 Hỗ trợ nhiều template khác nhau
- 🔄 Xuất PDF trực tiếp
- 🔄 Lưu lịch sử xuất file
- 🔄 Xuất hàng loạt nhiều đề thi
- 🔄 Tùy chỉnh format câu hỏi

## Kết luận

Tính năng xuất đề thi ra Word đã được hoàn thành với đầy đủ chức năng:

1. **Backend**: API hoàn chỉnh với xử lý template và dữ liệu
2. **Frontend**: Dialog popup thân thiện với người dùng
3. **Integration**: Tích hợp mượt mà vào trang chi tiết đề thi
4. **Testing**: Có script test đầy đủ để kiểm tra

Người dùng có thể dễ dàng xuất đề thi ra Word với thông tin tùy chỉnh chỉ bằng vài click chuột.
