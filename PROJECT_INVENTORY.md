# Graduation Project - Complete Inventory

**Project Type**: Educational Question Bank & Exam Management System  
**Architecture**: Microservices with Docker containerization  
**Main Technologies**: NestJS (Backend), React (Frontend), SQL Server (Database)

## 📂 Project Structure Overview

```
D:\Code\Graduation\
├── backend/                 # NestJS API Server
├── frontend/                # React Application
├── database/                # Database Scripts & Migrations
├── deployment/              # Deployment Configurations
├── monitoring/              # Monitoring Setup (Prometheus/Grafana)
├── search/                  # Qdrant Vector Search Configuration
├── caching/                 # Redis Cache Configuration
├── message-queue/           # Kafka Message Queue
├── scripts/                 # Utility & Automation Scripts
├── template/                # Document Templates (HUTECH format)
├── docs/                    # Documentation
└── docker files            # Docker Configuration Files
```

## 🎯 Core Components

### 1. Backend Service (NestJS)
**Location**: `/backend`  
**Port**: 3001  
**Purpose**: RESTful API server for managing questions, exams, and users

**Key Modules**:
- **Authentication Module** (`/src/modules/auth/`)
  - JWT-based authentication
  - Role-based access control (Admin/Teacher)
  - Password management

- **Question Management** (`/src/modules/cau-hoi/`)
  - CRUD operations for questions
  - Multiple question types support
  - Multimedia attachments handling

- **Exam Generation** (`/src/modules/de-thi/`)
  - Matrix-based exam generation
  - Bulk exam generation
  - CLO (Course Learning Outcome) mapping

- **File Management** (`/src/modules/files/`)
  - DigitalOcean Spaces integration
  - Local storage fallback
  - Image/Audio/Document processing

- **Document Parsing** (`/src/controllers/`)
  - Enhanced DOCX parser
  - Python-based parser integration
  - WASM-based parser
  - Question extraction from Word documents

- **Integration API** (`/src/modules/integration/`)
  - Inter-system communication
  - Data synchronization
  - External system integration

### 2. Frontend Application (React)
**Location**: `/frontend`  
**Port**: 3000  
**Purpose**: Web UI for system interaction

**Key Features**:
- **Question Management UI**
  - Create/Edit/Delete questions
  - Bulk upload from Word documents
  - Media preview and management
  - Rich text editor with LaTeX support

- **Exam Management**
  - Exam matrix creation
  - Question selection interface
  - Export to PDF/DOCX
  - Answer key generation

- **User Dashboard**
  - Role-based access control
  - Statistics and analytics
  - Approval workflow for teachers

**UI Libraries**:
- Material-UI
- Ant Design
- Radix UI
- Tailwind CSS
- KaTeX (Math rendering)
- React Quill (Rich text editor)

### 3. Database Layer
**Location**: `/database`  
**Type**: SQL Server  
**Purpose**: Data persistence and management

**Key Tables**:
- `User` - System users and authentication
- `Khoa` - Faculties/Departments
- `MonHoc` - Subjects
- `Phan` - Chapters
- `CauHoi` - Questions
- `CauTraLoi` - Answer choices
- `DeThi` - Generated exams
- `ChiTietDeThi` - Exam-question relationships
- `CLO` - Course Learning Outcomes
- `Files` - Media attachments
- `CauHoiChoDuyet` - Questions pending approval
- `YeuCauRutTrich` - Exam generation requests

**Migration Scripts**: `/database/migrations/`
- Database schema updates
- Data migration utilities
- Cleanup scripts

### 4. Infrastructure Services

#### Redis Cache
**Purpose**: Session management, caching, queue system
**Port**: 6379
**Integration**: Bull queue for background jobs

#### Apache Kafka
**Purpose**: Event-driven messaging between services
**Port**: 9092
**Components**:
- Zookeeper (Port 2181)
- Event streaming for real-time updates

#### Qdrant Vector Search
**Purpose**: Semantic search for questions
**Port**: 6333
**Features**: AI-powered question similarity search

#### Monitoring Stack
**Components**:
- **Prometheus** (Port 9090): Metrics collection
- **Grafana** (Port 3002): Visualization dashboards
**Metrics Tracked**:
- API response times
- Database query performance
- File upload statistics
- User activity metrics

### 5. File Storage
**Primary**: DigitalOcean Spaces
**Fallback**: Local storage
**Directories**:
- `/uploads/questions` - Question attachments
- `/uploads/answers` - Answer media files
- `/uploads/audio` - Audio files
- `/output` - Generated exam files
- `/public` - Public assets

## 🔧 Configuration Files

### Docker Configuration
- `docker-compose.yml` - Development environment
- `docker-compose.production.yml` - Production deployment
- `docker-compose.monitoring.yml` - Monitoring stack
- `docker-compose.build.yml` - Build configuration
- `Dockerfile` - Main container definition

### Environment Configuration
- `.env` - Development environment variables
- `.env.production` - Production settings
- Backend specific: `/backend/.env`
- Frontend specific: `/frontend/.env`

### Build & Deployment Scripts
- `build-and-deploy.bat/sh` - Full deployment script
- `quick-build.py` - Python quick build utility
- `docker-build-optimized.py` - Optimized Docker build
- `deploy-to-digital-ocean.py` - Cloud deployment

## 📚 Documentation

### Main Documentation
- `README.md` - Project overview and setup
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `DOCKER_DEPLOYMENT_GUIDE.md` - Docker-specific guide
- `USER_GUIDELINES.md` - User manual
- `CLAUDE.md` - AI assistant integration notes

### Database Documentation
- `/database/README.md` - Database structure
- `/database/docs/` - Detailed database documentation
- Migration guides and reports

## 🛠️ Utility Scripts

### Question Processing
- `/scripts/docx_parser.py` - Word document parser
- `/scripts/clean_question_content.py` - Content sanitization
- `/scripts/test_parser.py` - Parser testing

### Media Processing
- `/scripts/convert_to_webp.py` - Image optimization
- `/scripts/webp_converter_gui.py` - GUI for batch conversion

### Database Management
- `/backend/db-switcher-interactive.js` - Database switching
- `/backend/test-db-connection.js` - Connection testing
- `/backend/execute_question_cleanup.js` - Data cleanup

### Testing Scripts
- Various test scripts for API, integration, and export functionality

## 📦 Dependencies

### Backend Stack
- **NestJS** v11.0.1 - Framework
- **TypeORM** v0.3.21 - ORM
- **Passport** - Authentication
- **Bull** - Queue management
- **Multer** - File uploads
- **docx** - Document generation
- **mammoth** - Word parsing
- **puppeteer** - PDF generation

### Frontend Stack
- **React** v18.2.0 - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form management

## 🚀 Deployment Information

### Production URLs
- Backend API: `http://localhost:3001`
- Frontend App: `http://localhost:3000`
- Swagger API Docs: `http://localhost:3001/api`
- Grafana Dashboard: `http://localhost:3002`
- Prometheus: `http://localhost:9090`

### Deployment Targets
- Local Docker environment
- DigitalOcean Droplets
- Docker Hub Registry: `lighthunter15723/question-bank-backend`

## 🔐 Security Features
- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- File type validation
- CORS configuration

## 📊 Key Features Summary

1. **Question Bank Management**
   - Multiple question types (MCQ, Essay, Fill-in-blank, Group)
   - Multimedia support (Images, Audio, LaTeX)
   - Word document import with AI parsing
   - Approval workflow

2. **Exam Generation**
   - Matrix-based generation
   - CLO mapping
   - Multiple variants
   - HUTECH template export

3. **User Management**
   - Admin and Teacher roles
   - Department isolation
   - Activity logging

4. **Integration Capabilities**
   - REST API
   - WebSocket support
   - Event-driven architecture
   - File storage integration

## 🔄 Workflow Processes

1. **Question Creation Flow**
   - Teacher creates/imports questions
   - Admin reviews and approves
   - Questions added to bank
   - Available for exam generation

2. **Exam Generation Flow**
   - Define exam matrix
   - Select questions by CLO
   - Apply difficulty weights
   - Generate exam variants
   - Export to PDF/DOCX

## 📈 System Capabilities
- Handles large question banks (10,000+ questions)
- Concurrent user support
- Real-time notifications
- Scalable microservices architecture
- Cloud-ready deployment
