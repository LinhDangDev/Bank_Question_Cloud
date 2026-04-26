# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend Commands
```bash
# Install dependencies
cd backend
bun install

# Development
bun run dev                # Start development server (http://localhost:3001)
bun run swagger           # View Swagger API documentation

# Database Management
bun run db:switch         # Interactive database switcher
bun run db:local          # Switch to local database
bun run db:server         # Switch to server database  
bun run db:status         # Check current database status
bun run db:test           # Test database connection
bun run setup:env         # Create initial .env file

# Testing
bun run test              # Run unit tests
bun run test:watch        # Run tests in watch mode
bun run test:cov          # Run tests with coverage
bun run test:e2e          # Run end-to-end tests
bun run test:api          # Test API endpoints

# Code Quality
bun run lint              # Run ESLint
bun run format            # Run Prettier

# Build
bun run build             # Build for production
bun run start:prod        # Start production server
```

### Frontend Commands
```bash
# Install dependencies
cd frontend
bun install

# Development
bun run dev               # Start development server (http://localhost:3000)

# Build
bun run build             # Build for production
bun run preview           # Preview production build

# Code Quality
bun run lint              # Run ESLint
```

## High-Level Architecture

### System Overview
This is a comprehensive educational system with two main applications:
- **Question Bank System (App A)**: Manages educational questions with multimedia support
- **Exam System (App B)**: Generates and exports exams based on question matrices

### Backend Architecture (NestJS)

#### Core Modules Structure
- **Auth Module**: JWT-based authentication with role-based access (Admin/Teacher)
- **Question Management**: 
  - `CauHoiModule`: Main question CRUD operations
  - `CauHoiChoDuyetModule`: Approval queue for teacher-submitted questions
  - `QuestionsImportModule`: Word document import with multimedia extraction
- **Exam Generation**:
  - `DeThiModule`: Exam creation and management
  - `ExamPackageModule`: Bulk exam generation with matrix-based selection
  - `ExamExportModule`: PDF/DOCX export with HUTECH template
- **File Processing**:
  - `FilesModule`: File upload and storage management
  - `WordMultimediaModule`: Extract media from Word documents
  - `EnhancedDocxParserModule`: Advanced Word parsing with LaTeX support
- **Integration**: 
  - `IntegrationModule`: API endpoints for external system integration

#### Key Services
- **DocxParserService**: Processes Word documents using Python scripts
- **MediaProcessingService**: Handles image/audio file processing
- **ContentReplacementService**: Manages media markup conversion
- **ExamPackageService**: Implements exam generation algorithms

#### Database Design
- Uses SQL Server with TypeORM
- Main entities: User, Khoa, MonHoc, Phan, CauHoi, CauTraLoi, DeThi, CLO
- Supports hierarchical questions (parent-child relationships)
- Tracks question usage statistics and difficulty ratings

### Frontend Architecture (React + TypeScript)

#### Component Structure
- **Pages**: Route-based components in `/pages`
- **Components**: Reusable UI components
- **Services**: API communication layer
- **Hooks**: Custom React hooks for common functionality

#### Key Features
- Math rendering using KaTeX and MathLive
- Rich text editing with React Quill
- Media preview and playback components
- Real-time form validation with React Hook Form
- Material-UI and Ant Design for UI components

### File Storage
- Uses DigitalOcean Spaces for media storage
- CDN support for fast file delivery
- Temporary file handling for imports

### Queue System
- Bull queue with Redis for background processing
- Handles heavy operations like bulk exam generation
- Prevents timeout issues for large operations

## Important Notes

### Environment Configuration
- Always use `bun run setup:env` to create initial .env file
- Database credentials must be configured before running
- DigitalOcean Spaces credentials required for file storage

### Word Import Feature
- Supports DOCX files with embedded images and equations
- Can import from ZIP/RAR archives containing Word files
- Uses Python scripts for enhanced parsing
- Maintains question structure and multimedia references

### Testing Strategy
- Unit tests use Jest with TypeScript support
- Test files follow `*.spec.ts` pattern
- Database tests require active connection
- API tests available via `bun run test:api`

### Security Considerations
- JWT tokens expire after 1 hour by default
- Teachers can only access their department's data
- File uploads validated for type and size
- SQL injection prevented via TypeORM parameterized queries

### Performance Optimization
- Redis caching for frequently accessed data
- Database indexes on commonly queried fields
- Connection pooling for database efficiency
- CDN for static file delivery