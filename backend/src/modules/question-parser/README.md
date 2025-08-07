# Question Parser Module

**Author:** Linh Dang Dev  
**Date:** 2025-07-10

## Overview

The Question Parser Module is a comprehensive Node.js/TypeScript solution for parsing, processing, and previewing educational questions from text content. It supports multiple question types including single questions, group questions, fill-in-blank questions, and questions with multimedia content.

## Features

### Question Types Supported

1. **Single Questions** - Individual questions with CLO and multiple choice answers
2. **Group Questions** - Questions that refer to a common passage or context
3. **Fill-in-Blank Questions** - Questions with placeholder blanks to be filled
4. **Media Questions** - Questions containing audio or image references

### Key Capabilities

- ✅ Parse questions from raw text content
- ✅ Generate HTML preview with beautiful styling
- ✅ Process media references ([audio: path] and [image: path])
- ✅ Convert legacy markup to modern HTML tags
- ✅ Upload media files to Digital Ocean Spaces
- ✅ Validate question structure and content
- ✅ Support for Vietnamese and English content
- ✅ Comprehensive error handling and warnings

## API Endpoints

### 1. Parse Text Content
```http
POST /question-parser/parse-text
Content-Type: application/json

{
  "text": "question content here",
  "uploadMedia": false,
  "generateThumbnails": false,
  "convertImages": true,
  "maxImageWidth": 400,
  "maxImageHeight": 300
}
```

### 2. Generate Preview
```http
POST /question-parser/preview-text
Content-Type: application/json

{
  "text": "question content here",
  "includeMedia": true,
  "maxImageWidth": 600,
  "maxImageHeight": 400
}
```

### 3. Validate and Preview
```http
POST /question-parser/validate-and-preview
Content-Type: application/json

{
  "text": "question content here",
  "includeMedia": true
}
```

### 4. Convert Legacy Markup
```http
POST /question-parser/convert-legacy-markup
Content-Type: application/json

{
  "content": "Text with [audio: path] and [image: path] markup"
}
```

### 5. Test Patterns
```http
GET /question-parser/test-patterns?type=single
```

## Question Format Examples

### Single Question
```
(CLO1) What is a database?
A. A collection of data
B. A software program
C. A hardware device
D. A network protocol
[<br>]
```

### Group Question
```
[<sg>]
(CLO2) Questions {<1>} –{<3>} refer to the following passage.
A database is a structured collection of data...
[<egc>]
(<1>) What is a database?
A. A collection of data
B. A software program
C. A hardware device
D. A network protocol
[<br>]
(<2>) What manages a database?
A. Operating system
B. DBMS
C. Web browser
D. Text editor
[<br>]
[</sg>]
```

### Fill-in-Blank Question
```
[<sg>]
Complete the following sentences.
A database is a {<1>}_____ collection of data managed by a {<2>}_____.
[<egc>]
(<1>)
A. structured
B. random
C. temporary
D. simple
[<br>]
(<2>)
A. DBMS
B. browser
C. editor
D. system
[<br>]
[</sg>]
```

### Question with Media
```
(CLO1) Listen to the audio [audio: ./audio/intro.mp3] and look at the diagram [image: ./images/schema.png].
What type of relationship is shown?
A. One-to-One
B. One-to-Many
C. Many-to-Many
D. None of the above
[<br>]
```

## Media Processing

### Supported Media Types
- **Audio**: .mp3, .wav, .m4a, .ogg, .aac, .flac
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg

### Media Markup Conversion
- `[audio: path]` → `<audio src="url" controls>...</audio>`
- `[image: path]` → `<img src="url" style="..." />`

### Digital Ocean Spaces Integration
- Automatic upload to `https://datauploads.sgp1.cdn.digitaloceanspaces.com/`
- Folder structure: `/audio/` and `/images/`
- WebP conversion for images (optional)
- Thumbnail generation (optional)

## Architecture

### Core Services

1. **QuestionParserService** - Main parsing logic
2. **MediaContentProcessorService** - Media processing and HTML conversion
3. **QuestionPreviewService** - HTML preview generation
4. **EnhancedWordImportService** - DOCX integration

### Key Components

```
question-parser/
├── controllers/
│   └── question-parser.controller.ts
├── services/
│   ├── question-parser.service.ts
│   ├── media-content-processor.service.ts
│   ├── question-preview.service.ts
│   └── enhanced-word-import.service.ts
├── interfaces/
│   └── question-parser.interface.ts
├── enums/
│   ├── question-type.enum.ts
│   └── file-type.enum.ts
└── test-samples/
    └── question-samples.ts
```

## Usage Examples

### Basic Text Parsing
```typescript
const result = await questionParser.parseQuestionsFromText(textContent);
console.log(`Parsed ${result.statistics.totalQuestions} questions`);
```

### Generate Preview
```typescript
const preview = await questionPreview.previewQuestionsFromText(textContent);
document.getElementById('preview').innerHTML = preview.html;
```

### Process Media
```typescript
const options = {
  uploadToSpaces: true,
  maxImageWidth: 800,
  convertImages: true
};
const result = await mediaProcessor.processMediaContent(content, mediaRefs, options);
```

## Response Format

### Parse Response
```json
{
  "success": true,
  "questions": [...],
  "mediaFiles": [...],
  "statistics": {
    "totalQuestions": 5,
    "singleQuestions": 2,
    "groupQuestions": 2,
    "fillInBlankQuestions": 1,
    "questionsWithMedia": 1,
    "totalMediaFiles": 2
  },
  "errors": [],
  "warnings": []
}
```

### Preview Response
```json
{
  "success": true,
  "html": "<div class='questions-preview-container'>...</div>",
  "css": "<style>...</style>",
  "questions": [...],
  "statistics": {...},
  "errors": [],
  "warnings": []
}
```

## Error Handling

The system provides comprehensive error handling:

- **Parsing Errors**: Invalid question format, missing markers
- **Media Errors**: File not found, unsupported format
- **Validation Errors**: Missing answers, invalid structure
- **Upload Errors**: Network issues, permission problems

## Integration

### With Existing Word Import
```typescript
const wordImport = new EnhancedWordImportService();
const result = await wordImport.importQuestionsFromDocx(file, maPhan, nguoiTao);
```

### With Question Bank Database
The parsed questions are automatically converted to database format compatible with the existing Question Bank schema.

## Testing

Use the test samples provided in `/test-samples/question-samples.ts`:

```typescript
import { SAMPLE_QUESTIONS } from '../test-samples/question-samples';

// Test single question parsing
const result = await questionParser.parseQuestionsFromText(
  SAMPLE_QUESTIONS.singleQuestion
);
```

## Configuration

### Environment Variables
```env
# Digital Ocean Spaces
SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
SPACES_BUCKET=datauploads
SPACES_ACCESS_KEY=your_access_key
SPACES_SECRET_KEY=your_secret_key

# Media Processing
MAX_IMAGE_WIDTH=1200
MAX_IMAGE_HEIGHT=800
CONVERT_IMAGES_TO_WEBP=true
```

## Future Enhancements

1. **LaTeX Support** - Mathematical equations and formulas
2. **Video Support** - Video file processing and embedding
3. **Advanced Validation** - Grammar and content checking
4. **Batch Processing** - Multiple file processing
5. **Export Formats** - PDF, Word, JSON export options
6. **Analytics** - Question difficulty analysis
7. **AI Integration** - Automatic question generation

## Contributing

When contributing to this module:

1. Follow TypeScript best practices
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility
5. Test with various question formats

## License

This module is part of the Question Bank System developed by Linh Dang Dev.
