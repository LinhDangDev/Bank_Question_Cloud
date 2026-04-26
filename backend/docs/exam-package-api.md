# Exam Package Upload API Documentation

**Author:** Linh Dang Dev  
**Created:** 2025-07-08  
**Version:** 1.0.0

## Overview

The Exam Package Upload API allows users to upload ZIP files containing Word documents with questions and associated media files (audio and images). The system automatically processes the content, uploads media to Digital Ocean Spaces, converts images to WebP format, and determines answer shuffling rules based on underline formatting.

## Features

- **ZIP File Processing**: Extract and validate ZIP package structure
- **Word Document Parsing**: Parse questions and answers from DOCX files
- **Media Processing**: 
  - Upload audio files to Digital Ocean Spaces
  - Convert images to WebP format and upload
  - Replace local media paths with full URLs
- **Answer Shuffling Detection**: Automatically set HoanVi values based on underline formatting
- **Database Integration**: Optionally save processed questions to database
- **Comprehensive Validation**: File type, size, and structure validation

## API Endpoints

### 1. Upload Exam Package

**Endpoint:** `POST /exam-packages/upload`

**Authentication:** Required (JWT Token)

**Roles:** `admin`, `teacher`

**Content-Type:** `multipart/form-data`

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | File | Yes | - | ZIP file containing Word document and media files |
| `maPhan` | String | No | - | Section ID to assign questions to |
| `processImages` | Boolean | No | `true` | Whether to process and convert images to WebP |
| `processAudio` | Boolean | No | `true` | Whether to process audio files |
| `limit` | Number | No | `100` | Maximum number of questions to process |
| `saveToDatabase` | Boolean | No | `false` | Whether to save processed questions to database |

#### ZIP Package Structure

```
exam-package.zip
├── questions.docx          # Word document with questions (required)
├── audio/                  # Audio files folder (optional)
│   ├── audio1.mp3
│   ├── audio2.wav
│   └── audio3.m4a
└── images/                 # Image files folder (optional)
    ├── image1.jpg
    ├── image2.png
    └── image3.gif
```

#### Word Document Format

**Questions Format:**
```
1. What is the capital of Vietnam?
A. Ho Chi Minh City
B. Hanoi
C. Da Nang
D. Hue

2. Which programming language is used for web development?
A. Python
B. JavaScript
C. Java
D. C++
```

**Media References:**
- Audio: `<audio src="./audio/filename.mp3">`
- Images: `<img src="./images/filename.jpg">`

**Answer Shuffling Rules:**
- **Underlined answers** → `HoanVi = false` (no shuffling)
- **Non-underlined answers** → `HoanVi = true` (allow shuffling)

#### Response

**Success Response (200):**
```json
{
  "packageId": "uuid-string",
  "questionCount": 25,
  "mediaFileCount": 15,
  "audioFileCount": 5,
  "imageFileCount": 10,
  "status": "success",
  "errors": [],
  "warnings": []
}
```

**Partial Success Response (200):**
```json
{
  "packageId": "uuid-string",
  "questionCount": 20,
  "mediaFileCount": 12,
  "audioFileCount": 4,
  "imageFileCount": 8,
  "status": "partial",
  "errors": [],
  "warnings": [
    "Some media files could not be processed",
    "2 images failed WebP conversion"
  ]
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Failed to process exam package: Invalid ZIP structure",
  "error": "Bad Request"
}
```

#### Status Values

- `success`: All processing completed successfully
- `partial`: Processing completed with some warnings
- `failed`: Processing failed with errors

### 2. Validate Exam Package

**Endpoint:** `POST /exam-packages/validate`

**Authentication:** Required (JWT Token)

**Roles:** `admin`, `teacher`

**Content-Type:** `multipart/form-data`

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | ZIP file to validate |

#### Response

```json
{
  "valid": true,
  "structure": {
    "hasWordDocument": true,
    "wordDocumentName": "questions.docx",
    "audioFiles": ["audio1.mp3", "audio2.wav"],
    "imageFiles": ["image1.jpg", "image2.png"],
    "totalFiles": 5
  },
  "errors": [],
  "warnings": ["Large file detected: audio1.mp3 (15MB)"]
}
```

## Media Processing Details

### Audio Files

**Supported Formats:** `.mp3`, `.wav`, `.m4a`, `.ogg`

**Processing:**
1. Validate file format and size
2. Upload to Digital Ocean Spaces (`/audio/` folder)
3. Generate public URL
4. Replace local references in content

**Output Format:**
```html
<audio src="https://datauploads.sgp1.digitaloceanspaces.com/audio/filename.mp3" controls></audio>
```

### Image Files

**Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`

**Processing:**
1. Validate file format and size
2. Convert to WebP format (quality: 85%)
3. Resize if larger than 1200x800px
4. Upload to Digital Ocean Spaces (`/images/` folder)
5. Generate public URL
6. Replace local references in content

**Output Format:**
```html
<img src="https://datauploads.sgp1.digitaloceanspaces.com/images/filename.webp" 
     style="max-width: 400px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
```

## Validation Rules

### File Validation

- **ZIP File Size:** Maximum 100MB
- **Individual File Size:** Maximum 50MB per file
- **Media File Size:** Maximum 10MB per media file
- **Allowed Extensions:** `.docx`, `.mp3`, `.wav`, `.m4a`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`

### Structure Validation

- Must contain exactly one Word document (`.docx`)
- Media files must be in `audio/` or `images/` folders
- No directory traversal attacks (`../` patterns)
- No suspicious file paths

### Content Validation

- Word document must not be empty
- Questions must follow numbered format
- Answers must follow A., B., C., D. format
- Media references must use relative paths

## Error Handling

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | No ZIP file provided | File parameter is missing |
| 400 | Only ZIP files are allowed | Invalid file extension |
| 400 | File size exceeds 100MB limit | ZIP file too large |
| 400 | maPhan is required when saveToDatabase is true | Missing required parameter |
| 400 | Package validation failed | Invalid ZIP structure |
| 400 | Failed to process media files | Media processing error |
| 401 | Unauthorized | Invalid or missing JWT token |
| 403 | Forbidden | Insufficient permissions |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Bad Request"
}
```

## Usage Examples

### cURL Example

```bash
curl -X POST \
  http://localhost:3001/exam-packages/upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@exam-package.zip' \
  -F 'maPhan=section-uuid' \
  -F 'processImages=true' \
  -F 'processAudio=true' \
  -F 'limit=50' \
  -F 'saveToDatabase=true'
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('file', zipFile);
formData.append('maPhan', 'section-uuid');
formData.append('processImages', 'true');
formData.append('processAudio', 'true');
formData.append('limit', '50');
formData.append('saveToDatabase', 'true');

const response = await fetch('/exam-packages/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

## Performance Considerations

- **Processing Time:** Depends on package size and media count
- **Memory Usage:** Large images may require significant memory for conversion
- **Network:** Media uploads to Digital Ocean Spaces require stable connection
- **Database:** Batch operations used for efficient question saving

## Security Features

- JWT authentication required
- Role-based access control
- File type validation
- Directory traversal protection
- File size limits
- Malicious content detection
