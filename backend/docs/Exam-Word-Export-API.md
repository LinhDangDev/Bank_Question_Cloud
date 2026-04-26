# Exam Word Export API Documentation

## Overview

API để xuất đề thi ra file Word với thông tin header tùy chỉnh và có thể bao gồm đáp án riêng biệt.

**Author**: Linh Dang Dev  
**Template**: `D:\Code\Graduation\template\TemplateHutechOffical.dotx`

## Features

- ✅ **Header tùy chỉnh**: Điền thông tin đề thi, môn học, thời gian, v.v.
- ✅ **Thông tin sinh viên**: Có thể để trống hoặc điền sẵn
- ✅ **Xuất kèm đáp án**: Tùy chọn hiển thị đáp án trong file
- ✅ **Template chuẩn HUTECH**: Sử dụng template chính thức
- ✅ **Preview trước khi xuất**: Xem trước dữ liệu đề thi

## API Endpoints

### 1. Lấy thông tin mặc định

**GET** `/exam-word-export/:examId/default-options`

Lấy thông tin mặc định của đề thi để điền vào form.

**Response:**
```json
{
  "success": true,
  "message": "Lấy thông tin mặc định thành công",
  "data": {
    "examTitle": "ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU",
    "subject": "Cơ sở dữ liệu",
    "academicYear": "2024",
    "examDate": "15/12/2024",
    "duration": "90 phút",
    "instructions": "Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.",
    "allowMaterials": false,
    "showAnswers": false,
    "separateAnswerSheet": false
  }
}
```

### 2. Xem trước đề thi

**GET** `/exam-word-export/:examId/preview`

Xem trước dữ liệu đề thi trước khi xuất.

**Response:**
```json
{
  "success": true,
  "message": "Lấy dữ liệu xem trước thành công",
  "data": {
    "examTitle": "ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU",
    "subject": "Cơ sở dữ liệu",
    "totalQuestions": 25,
    "questions": [
      {
        "number": 1,
        "content": "Câu hỏi về cơ sở dữ liệu...",
        "answerCount": 4
      }
    ],
    "hasMoreQuestions": true
  }
}
```

### 3. Xuất đề thi ra Word

**POST** `/exam-word-export/:examId/export`

Xuất đề thi ra file Word với thông tin tùy chỉnh.

**Request Body:**
```json
{
  "examTitle": "ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU",
  "subject": "Cơ sở dữ liệu",
  "course": "Khoa CNTT",
  "semester": "Học kỳ 1",
  "academicYear": "2024-2025",
  "examDate": "15/12/2024",
  "duration": "90 phút",
  "instructions": "Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.",
  "allowMaterials": false,
  "showAnswers": true,
  "separateAnswerSheet": true,
  "studentInfo": {
    "studentId": "SV001",
    "studentName": "Nguyễn Văn A",
    "className": "CNTT01"
  }
}
```

**Response:** File Word (.docx)

### 4. Lấy danh sách template

**GET** `/exam-word-export/templates`

Lấy danh sách các template có sẵn.

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách template thành công",
  "data": {
    "templates": [
      {
        "id": "standard",
        "name": "Template chuẩn HUTECH",
        "description": "Template chuẩn với header đầy đủ thông tin",
        "features": ["Header thông tin", "Câu hỏi", "Đáp án tùy chọn"]
      }
    ]
  }
}
```

## Request Parameters

### ExamWordExportOptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `examTitle` | string | No | Tiêu đề đề thi |
| `subject` | string | No | Tên môn học |
| `course` | string | No | Khoa/Lớp |
| `semester` | string | No | Học kỳ |
| `academicYear` | string | No | Năm học |
| `examDate` | string | No | Ngày thi |
| `duration` | string | No | Thời gian làm bài |
| `instructions` | string | No | Hướng dẫn làm bài |
| `allowMaterials` | boolean | No | Cho phép sử dụng tài liệu |
| `showAnswers` | boolean | No | Hiển thị đáp án |
| `separateAnswerSheet` | boolean | No | Tách riêng bảng đáp án |
| `studentInfo` | object | No | Thông tin sinh viên |

### StudentInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentId` | string | No | Mã số sinh viên |
| `studentName` | string | No | Họ tên sinh viên |
| `className` | string | No | Lớp |

## Template Structure

File template `TemplateHutechOffical.dotx` có cấu trúc:

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

## Usage Examples

### Frontend JavaScript

```javascript
// 1. Lấy thông tin mặc định
const defaultOptions = await fetch(`/api/exam-word-export/${examId}/default-options`)
  .then(res => res.json());

// 2. Hiển thị form cho người dùng điền thông tin
const formData = {
  ...defaultOptions.data,
  examTitle: "ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU",
  course: "Khoa CNTT",
  showAnswers: true
};

// 3. Xuất file Word
const response = await fetch(`/api/exam-word-export/${examId}/export`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'DeThi.docx';
a.click();
```

### cURL Examples

```bash
# Lấy thông tin mặc định
curl -X GET "http://localhost:3000/exam-word-export/EXAM_ID/default-options"

# Xuất đề thi cơ bản
curl -X POST "http://localhost:3000/exam-word-export/EXAM_ID/export" \
  -H "Content-Type: application/json" \
  -d '{
    "examTitle": "ĐỀ THI CUỐI KỲ",
    "subject": "Cơ sở dữ liệu",
    "showAnswers": false
  }' \
  --output "DeThi.docx"

# Xuất đề thi kèm đáp án
curl -X POST "http://localhost:3000/exam-word-export/EXAM_ID/export" \
  -H "Content-Type: application/json" \
  -d '{
    "examTitle": "ĐỀ THI CUỐI KỲ (KÈM ĐÁP ÁN)",
    "subject": "Cơ sở dữ liệu",
    "showAnswers": true,
    "separateAnswerSheet": true
  }' \
  --output "DeThi_DapAn.docx"
```

## Testing

Chạy script test:

```bash
cd backend
node test-exam-word-export.js
```

Script sẽ test tất cả các endpoint và tạo file Word mẫu để kiểm tra.

## Error Handling

- **404**: Đề thi không tồn tại
- **400**: Dữ liệu đầu vào không hợp lệ
- **500**: Lỗi template hoặc lỗi hệ thống

## Notes

- Template phải tồn tại tại đường dẫn chỉ định
- File xuất ra có định dạng `.docx`
- Hỗ trợ tiếng Việt đầy đủ
- Tự động cleanup file tạm sau khi xuất
