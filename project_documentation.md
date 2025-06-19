# Graduation Project Documentation

## Technologies Used

**Backend:**
- NestJS (TypeScript) framework
- TypeORM for database operations
- Python for document parsing
- Queue system for background processing
- JWT authentication

**Frontend:**
- React with TypeScript
- Tailwind CSS
- Vite as build tool

**Infrastructure:**
- Docker for containerization
- SQL Database
- Prometheus for monitoring (planned)
- PDF generation services
- Qdrant for search (planned)
- Caching layer (planned)

## System Architecture

```mermaid
flowchart TB
    subgraph "Frontend"
        UI["React UI"]
        Components["UI Components"]
        Pages["Pages"]
        Context["Context API"]
        APIService["API Services"]
    end

    subgraph "Backend"
        NestJS["NestJS Application"]
        Auth["Authentication Module"]
        Controllers["REST Controllers"]
        Services["Business Services"]
        Repositories["TypeORM Repositories"]
        Queue["Queue Module"]
        DocxParser["Document Parser Service"]
        PDFService["PDF Service"]
        ExtractProcessor["Extraction Processor"]
    end

    subgraph "Infrastructure"
        Database[(SQL Database)]
        FileStorage["File Storage"]
        MessageQueue["Message Queue"]
        Docker["Docker Containers"]
        Monitoring["Prometheus Monitoring"]
        Search["Qdrant Search Engine"]
        Caching["Caching Layer"]
    end

    UI --> Components
    UI --> Pages
    UI --> Context
    Pages --> APIService
    Components --> APIService

    APIService --> Controllers
    Controllers --> Auth
    Controllers --> Services
    Services --> Repositories
    Services --> Queue
    Services --> DocxParser
    Services --> PDFService
    Queue --> ExtractProcessor
    ExtractProcessor --> DocxParser

    Repositories --> Database
    DocxParser --> FileStorage
    PDFService --> FileStorage
    Queue --> MessageQueue
    ExtractProcessor --> MessageQueue

    Monitoring -.-> NestJS
    Monitoring -.-> Docker

    Search -.-> Services
    Caching -.-> Services
```

## Main User Flows

```mermaid
flowchart TD
    User["User"]

    subgraph "Authentication Flow"
        Login["Login"]
        JWT["JWT Token"]
        AuthGuard["Auth Guards"]
    end

    subgraph "Question Management"
        CreateQ["Create Question"]
        ImportQ["Import Questions"]
        SearchQ["Search Questions"]
        ManageQ["Manage Questions"]
    end

    subgraph "Exam Management"
        CreateExam["Create Exam"]
        GenerateExam["Generate Exam"]
        PDFExam["Export to PDF"]
    end

    subgraph "Document Processing"
        UploadDoc["Upload Document"]
        ParseDoc["Parse Document"]
        ExtractQ["Extract Questions"]
    end

    User --> Login
    Login --> JWT
    JWT --> AuthGuard

    AuthGuard --> CreateQ
    AuthGuard --> ImportQ
    AuthGuard --> SearchQ
    AuthGuard --> ManageQ
    AuthGuard --> CreateExam

    ImportQ --> UploadDoc
    UploadDoc --> ParseDoc
    ParseDoc --> ExtractQ
    ExtractQ --> ManageQ

    CreateExam --> GenerateExam
    GenerateExam --> PDFExam
```

## Entity Relationships

```mermaid
erDiagram
    User ||--o{ DeThi : creates
    User ||--o{ CauHoi : creates
    User ||--o{ YeuCauRutTrich : requests

    Khoa ||--o{ MonHoc : contains
    MonHoc ||--o{ Phan : contains
    Phan ||--o{ CauHoi : contains

    CLO ||--o{ CauHoi : associated_with

    CauHoi ||--o{ CauTraLoi : has
    CauHoi ||--o{ Files : has_attachments

    DeThi ||--o{ ChiTietDeThi : contains
    ChiTietDeThi }o--|| CauHoi : references
    ChiTietDeThi }o--|| Phan : references

    YeuCauRutTrich ||--|{ DeThi : generates

    User {
        int id
        string username
        string password
        string email
        string role
        datetime createdAt
    }

    Khoa {
        int id
        string tenKhoa
        string maKhoa
    }

    MonHoc {
        int id
        string tenMonHoc
        string maMonHoc
        int khoaId
        int soTinChi
    }

    Phan {
        int id
        string tenPhan
        string maPhan
        int monHocId
        int thuTu
    }

    CLO {
        int id
        string maCLO
        string moTa
        int monHocId
        int mucDo
    }

    CauHoi {
        int id
        string noiDung
        string loai
        int doKho
        int phanId
        int userId
        boolean isParent
        int parentId
        datetime createdAt
        string status
    }

    CauTraLoi {
        int id
        string noiDung
        boolean dapAn
        int cauHoiId
        string giaiThich
    }

    DeThi {
        int id
        string tenDeThi
        string maDeThi
        datetime ngayTao
        int userId
        int thoiGianLamBai
        string trangThai
    }

    ChiTietDeThi {
        int id
        int deThiId
        int cauHoiId
        int thuTu
        int diemSo
    }

    YeuCauRutTrich {
        int id
        string tieuChi
        int soLuong
        int doKho
        int monHocId
        int[] phanIds
        int[] cloIds
        datetime ngayYeuCau
        string trangThai
    }

    Files {
        int id
        string fileName
        string originalName
        string path
        string fileType
        int size
        string entityType
        int entityId
    }
```

## Complete & Incomplete Features

```mermaid
flowchart TB
    subgraph "Complete Features"
        Auth["Authentication & Authorization"]
        UserMgmt["User Management"]
        QuestMgmt["Question Management"]
        ExamMgmt["Exam Management"]
        DocImport["Document Import & Parsing"]
        FacultyMgmt["Faculty & Subject Management"]
    end

    subgraph "Partially Complete"
        PDFGenerate["PDF Generation"]
        QueueSystem["Queue System"]
        CLOTracking["CLO Tracking"]
        ExamTemplates["Exam Templates"]
        MediaSupport["Media Support"]
    end

    subgraph "Incomplete"
        SearchEngine["Search Engine"]
        CachingLayer["Caching"]
        Monitoring["Monitoring"]
        Analytics["Analytics Dashboard"]
        APIMetrics["API Metrics"]
    end

    %% Connections between features
    Auth --> UserMgmt
    UserMgmt --> QuestMgmt
    QuestMgmt --> ExamMgmt
    DocImport --> QuestMgmt
    FacultyMgmt --> QuestMgmt

    QuestMgmt --> PDFGenerate
    ExamMgmt --> PDFGenerate
    DocImport --> QueueSystem
    MediaSupport --> QueueSystem

    FacultyMgmt --> CLOTracking
    ExamMgmt --> ExamTemplates
    QuestMgmt --> MediaSupport

    QuestMgmt -.-> SearchEngine
    Auth -.-> CachingLayer
    QuestMgmt -.-> CachingLayer
    Auth -.-> Monitoring
    QueueSystem -.-> Monitoring
    ExamMgmt -.-> Analytics
    QuestMgmt -.-> Analytics
    Auth -.-> APIMetrics
```

## Detailed Flow: Document Import & Question Extraction

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Backend API
    participant FileService as Files Service
    participant QueueModule as Queue Module
    participant Processor as Extraction Processor
    participant Parser as DOCX Parser Service
    participant DB as Database

    User->>UI: Upload DOCX document
    UI->>API: POST /files/upload
    API->>FileService: Handle file upload
    FileService->>FileService: Save file to uploads/questions/
    FileService->>API: Return fileId

    API->>QueueModule: Add extraction job
    QueueModule->>QueueModule: Create job in queue
    QueueModule->>API: Return jobId
    API->>UI: Return status & jobId

    QueueModule->>Processor: Process next job
    Processor->>Parser: Extract questions from DOCX

    alt Successful extraction
        Parser->>Parser: Parse document structure
        Parser->>Parser: Identify questions & answers
        Parser->>Parser: Process any LaTeX formulas
        Parser->>Parser: Handle image & media attachments
        Parser->>DB: Save extracted questions & answers
        Parser->>DB: Update job status to complete
    else Failed extraction
        Parser->>DB: Log error details
        Parser->>DB: Update job status to failed
    end

    User->>UI: Check extraction status
    UI->>API: GET /questions-import/status/{jobId}
    API->>DB: Query job status
    API->>UI: Return status details

    User->>UI: View & edit extracted questions
    UI->>API: GET /cau-hoi?filter=recent
    API->>DB: Query recently extracted questions
    API->>UI: Return questions list with details
```

## Detailed Flow: Exam Generation with CLO Requirements

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Backend API
    participant YCRTService as YeuCauRutTrich Service
    participant ExamService as Exam Service
    participant PDFService as PDF Service
    participant DB as Database
    participant Templates as Template Files

    User->>UI: Create exam requirements
    UI->>UI: Select subject, chapters, CLOs
    UI->>UI: Define difficulty distribution
    UI->>UI: Set question counts

    UI->>API: POST /yeu-cau-rut-trich
    API->>YCRTService: Process requirements
    YCRTService->>DB: Save requirements
    YCRTService->>API: Return requirementId
    API->>UI: Display saved requirements

    User->>UI: Generate exam from requirements
    UI->>API: POST /de-thi/generate/{requirementId}
    API->>ExamService: Generate exam

    ExamService->>DB: Query questions matching criteria
    ExamService->>ExamService: Apply selection algorithm
    ExamService->>ExamService: Balance CLO coverage
    ExamService->>ExamService: Verify difficulty distribution
    ExamService->>DB: Save exam structure (de-thi)
    ExamService->>DB: Save question mappings (chi-tiet-de-thi)

    ExamService->>API: Return generated exam
    API->>UI: Show exam preview

    User->>UI: Export exam to PDF
    UI->>API: GET /de-thi/{examId}/pdf
    API->>PDFService: Generate PDF with template
    PDFService->>Templates: Get exam template
    PDFService->>PDFService: Render questions & answers
    PDFService->>PDFService: Format document with template
    PDFService->>API: Return PDF document
    API->>UI: Provide PDF for download
```

## Module Interactions & Dependencies

```mermaid
flowchart TD
    AppModule --> AuthModule
    AppModule --> DatabaseModule
    AppModule --> QueueModule
    AppModule --> MonHocModule
    AppModule --> KhoaModule
    AppModule --> PhanModule
    AppModule --> CauHoiModule
    AppModule --> CauTraLoiModule
    AppModule --> CLOModule
    AppModule --> DeThiModule
    AppModule --> ChiTietDeThiModule
    AppModule --> YeuCauRutTrichModule
    AppModule --> FilesModule
    AppModule --> QuestionsImportModule

    AuthModule --> DatabaseModule
    AuthModule --> JwtModule

    DatabaseModule --> TypeORM

    QueueModule --> QueueProcessor
    QueueProcessor --> ExtractionProcessor

    MonHocModule --> KhoaModule
    MonHocModule --> DatabaseModule

    PhanModule --> MonHocModule
    PhanModule --> DatabaseModule

    CauHoiModule --> PhanModule
    CauHoiModule --> CLOModule
    CauHoiModule --> FilesModule
    CauHoiModule --> DatabaseModule

    CauTraLoiModule --> CauHoiModule
    CauTraLoiModule --> DatabaseModule

    DeThiModule --> YeuCauRutTrichModule
    DeThiModule --> CauHoiModule
    DeThiModule --> ChiTietDeThiModule
    DeThiModule --> PDFService
    DeThiModule --> DatabaseModule

    ChiTietDeThiModule --> DeThiModule
    ChiTietDeThiModule --> CauHoiModule
    ChiTietDeThiModule --> DatabaseModule

    YeuCauRutTrichModule --> MonHocModule
    YeuCauRutTrichModule --> PhanModule
    YeuCauRutTrichModule --> CLOModule
    YeuCauRutTrichModule --> DatabaseModule

    FilesModule --> QueueModule
    FilesModule --> DatabaseModule

    QuestionsImportModule --> FilesModule
    QuestionsImportModule --> QueueModule
    QuestionsImportModule --> CauHoiModule
    QuestionsImportModule --> CauTraLoiModule
    QuestionsImportModule --> DocxParserService

    subgraph "Services"
        DocxParserService
        PDFService
        ExamService
    end

    DocxParserService --> FilesModule
    PDFService --> FilesModule
    ExamService --> CauHoiModule
    ExamService --> DeThiModule
```

## Deployment Architecture (Current & Planned)

```mermaid
flowchart TB
    Client["Web Browser"]

    subgraph "Docker Environment"
        subgraph "Frontend Container"
            ReactApp["React Application"]
            Nginx["Nginx Web Server"]
        end

        subgraph "Backend Container"
            NestJS["NestJS API"]
            NodeJS["Node.js Runtime"]
        end

        subgraph "Database Container"
            SQL["SQL Database"]
        end

        subgraph "Queue Container"
            MessageQueue["Message Queue System"]
        end

        subgraph "Search Container"
            SearchEngine["Qdrant Search Engine"]
        end

        subgraph "Caching Container"
            Cache["Caching Layer"]
        end

        subgraph "Monitoring Container"
            Prometheus["Prometheus"]
            Grafana["Grafana"]
        end

        subgraph "Storage"
            FileVolume["File Volume"]
        end
    end

    Client --> Nginx
    Nginx --> ReactApp
    ReactApp --> NestJS

    NestJS --> SQL
    NestJS --> MessageQueue
    NestJS --> SearchEngine
    NestJS --> Cache

    NestJS --> FileVolume
    MessageQueue --> FileVolume

    Prometheus --> NestJS
    Prometheus --> SQL
    Prometheus --> MessageQueue
    Prometheus --> SearchEngine
    Prometheus --> Cache

    Grafana --> Prometheus
```

## Project Summary

The graduation project is a comprehensive question bank and exam generation system with both completed and planned components. The system is designed around:

### Core System Components

1. **Frontend**: React application with component-based UI, page routing, context API, and responsive design

2. **Backend**: NestJS application with modules for:
   - Authentication and authorization
   - Question management
   - Exam generation
   - Document parsing
   - Faculty and subject structure
   - CLO tracking

3. **Infrastructure**:
   - SQL Database
   - Docker containerization
   - File storage
   - Message queue system
   - Planned search engine (Qdrant)
   - Planned caching and monitoring

### Key Features (Completed & Planned)

- User authentication with role-based access
- Faculty, subject, and chapter management
- Question creation and organization by type
- Document parsing to extract questions from Word files
- Exam generation based on CLO requirements
- PDF generation for exams
- Media handling for questions (audio, images)
- Queue system for background processing
- Search functionality (planned)
- Monitoring and analytics (planned)

### System Flows

1. **Authentication Flow**: User login → JWT token → Protected resources
2. **Question Management**: Create/import/search/edit questions organized by subject and chapter
3. **Document Processing**: Upload DOCX → Queue processing → Extract questions → Save to database
4. **Exam Generation**: Define requirements → Select questions → Generate exam structure → Create PDF
5. **CLO Tracking**: Link questions to CLOs → Ensure coverage in exams → Track assessment metrics
