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

# Phân tích và thiết kế hệ thống

## 2.2.1 Kiến trúc hệ thống

### 2.2.1.1 Kiến trúc tổng quan
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

### 2.2.1.2 Kiến trúc Module
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

## 2.2.2 Thiết kế cơ sở dữ liệu

### 2.2.2.1 Sơ đồ quan hệ thực thể (ERD)
```mermaid
erDiagram
    Khoa ||--o{ MonHoc : "contains"
    MonHoc ||--o{ Phan : "contains"
    MonHoc ||--o{ DeThi : "has"
    Phan ||--o{ CauHoi : "contains"
    Phan ||--o{ ChiTietDeThi : "details"
    CauHoi ||--o{ CauTraLoi : "has"
    CauHoi ||--o{ Files : "has_attachments"
    CauHoi ||--o{ ChiTietDeThi : "details"
    CLO ||--o{ CauHoi : "associated_with"
    DeThi ||--o{ ChiTietDeThi : "contains"

    User {
        uniqueidentifier UserId PK
        nvarchar_100_ LoginName
        nvarchar_100_ Email
        nvarchar_255_ Name
        nvarchar_128_ Password
        datetime DateCreated
        bit IsDeleted
        bit IsLockedOut
        datetime LastActivityDate
        datetime LastLoginDate
        datetime LastPasswordChangedDate
        datetime LastLockoutDate
        int FailedPwdAttemptCount
        datetime FailedPwdAttemptWindowStart
        int FailedPwdAnswerCount
        datetime FailedPwdAnswerWindowStart
        nvarchar_255_ PasswordSalt
        ntext Comment
        bit IsBuildInUser
    }

    Khoa {
        uniqueidentifier MaKhoa PK
        nvarchar_250_ TenKhoa
        bit XoaTamKhoa
        datetime NgaySua
        datetime NgayTao
    }

    MonHoc {
        uniqueidentifier MaMonHoc PK
        uniqueidentifier MaKhoa FK
        nvarchar_50_ MaSoMonHoc
        nvarchar_250_ TenMonHoc
        bit XoaTamMonHoc
        datetime NgayTao
        datetime NgayXoa
    }

    Phan {
        uniqueidentifier MaPhan PK
        uniqueidentifier MaMonHoc FK
        nvarchar_250_ TenPhan
        nvarchar_max_ NoiDung
        int ThuTu
        int SoLuongCauHoi
        uniqueidentifier MaPhanCha
        int MaSoPhan
        bit XoaTamPhan
        bit LaCauHoiNhom
        datetime NgayTao
        datetime NgaySua
    }

    CLO {
        uniqueidentifier MaCLO PK
        nvarchar_250_ TenCLO
        nvarchar_max_ MoTa
        int ThuTu
        bit XoaTamCLO
    }

    CauHoi {
        uniqueidentifier MaCauHoi PK
        uniqueidentifier MaPhan FK
        int MaSoCauHoi
        nvarchar_max_ NoiDung
        bit HoanVi
        smallint CapDo
        int SoCauHoiCon
        float DoPhanCachCauHoi
        uniqueidentifier MaCauHoiCha
        bit XoaTamCauHoi
        int SoLanDuocThi
        int SoLanDung
        datetime NgayTao
        datetime NgaySua
        uniqueidentifier MaCLO FK
    }

    CauTraLoi {
        uniqueidentifier MaCauTraLoi PK
        uniqueidentifier MaCauHoi FK
        nvarchar_max_ NoiDung
        int ThuTu
        bit LaDapAn
        bit HoanVi
    }

    DeThi {
        uniqueidentifier MaDeThi PK
        uniqueidentifier MaMonHoc FK
        nvarchar_250_ TenDeThi
        datetime NgayTao
        bit DaDuyet
    }

    ChiTietDeThi {
        uniqueidentifier MaDeThi PK, FK
        uniqueidentifier MaPhan PK, FK
        uniqueidentifier MaCauHoi PK, FK
        int ThuTu
    }

    YeuCauRutTrich {
        uniqueidentifier MaYeuCauDe PK
        nvarchar_50_ HoTenGiaoVien
        nvarchar_max_ NoiDungRutTrich
        datetime NgayLay
    }

    Files {
        uniqueidentifier MaFile PK
        uniqueidentifier MaCauHoi FK
        nvarchar_250_ TenFile
        int LoaiFile
        uniqueidentifier MaCauTraLoi
    }
```

### 2.2.2.2 Mô tả chi tiết các bảng

**Bảng User**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| UserId | uniqueidentifier | Khóa chính |
| LoginName | nvarchar(100) | Tên đăng nhập |
| Email | nvarchar(100) | Địa chỉ email |
| Name | nvarchar(255) | Tên người dùng |
| Password | nvarchar(128) | Mật khẩu (đã băm) |
| DateCreated | datetime | Ngày tạo tài khoản |
| IsDeleted | bit | Đã xóa hay chưa |
| IsLockedOut | bit | Tài khoản có bị khóa không |
| LastActivityDate | datetime | Ngày hoạt động cuối cùng |
| LastLoginDate | datetime | Ngày đăng nhập cuối |
| LastPasswordChangedDate | datetime | Ngày đổi mật khẩu cuối |
| LastLockoutDate | datetime | Ngày khóa tài khoản cuối |
| FailedPwdAttemptCount | int | Số lần nhập sai mật khẩu |
| FailedPwdAttemptWindowStart | datetime | Thời điểm bắt đầu cửa sổ đếm lỗi MK |
| FailedPwdAnswerCount | int | Số lần nhập sai câu trả lời bí mật |
| FailedPwdAnswerWindowStart | datetime | Thời điểm bắt đầu cửa sổ đếm lỗi câu trả lời |
| PasswordSalt | nvarchar(255) | Chuỗi salt cho mật khẩu |
| Comment | ntext | Ghi chú |
| IsBuildInUser | bit | Là người dùng hệ thống? |

**Bảng Khoa**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaKhoa | uniqueidentifier | Khóa chính |
| TenKhoa | nvarchar(250) | Tên khoa |
| XoaTamKhoa | bit | Đánh dấu xóa tạm |
| NgaySua | datetime | Ngày cập nhật |
| NgayTao | datetime | Ngày tạo |

**Bảng MonHoc**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaMonHoc | uniqueidentifier | Khóa chính |
| MaKhoa | uniqueidentifier | Khóa ngoại đến Khoa |
| MaSoMonHoc | nvarchar(50) | Mã số của môn học |
| TenMonHoc | nvarchar(250) | Tên môn học |
| XoaTamMonHoc | bit | Đánh dấu xóa tạm |
| NgayTao | datetime | Ngày tạo |
| NgayXoa | datetime | Ngày xóa |

**Bảng Phan**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaPhan | uniqueidentifier | Khóa chính |
| MaMonHoc | uniqueidentifier | Khóa ngoại đến Môn học |
| TenPhan | nvarchar(250) | Tên phần/chương |
| NoiDung | nvarchar(max) | Nội dung chi tiết của phần |
| ThuTu | int | Thứ tự của phần |
| SoLuongCauHoi | int | Số lượng câu hỏi trong phần |
| MaPhanCha | uniqueidentifier | Khóa ngoại tự tham chiếu (phần cha) |
| MaSoPhan | int | Mã số của phần |
| XoaTamPhan | bit | Đánh dấu xóa tạm |
| LaCauHoiNhom | bit | Là phần chứa câu hỏi nhóm? |
| NgayTao | datetime | Ngày tạo |
| NgaySua | datetime | Ngày cập nhật |

**Bảng CLO**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaCLO | uniqueidentifier | Khóa chính |
| TenCLO | nvarchar(250) | Tên/Mã CLO |
| MoTa | nvarchar(max) | Mô tả chi tiết |
| ThuTu | int | Thứ tự |
| XoaTamCLO | bit | Đánh dấu xóa tạm |

**Bảng CauHoi**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaCauHoi | uniqueidentifier | Khóa chính |
| MaPhan | uniqueidentifier | Khóa ngoại đến Phần |
| MaSoCauHoi | int | Mã số câu hỏi |
| NoiDung | nvarchar(max) | Nội dung câu hỏi |
| HoanVi | bit | Cho phép hoán vị đáp án? |
| CapDo | smallint | Cấp độ khó |
| SoCauHoiCon | int | Số câu hỏi con |
| DoPhanCachCauHoi | float | Độ phân cách câu hỏi |
| MaCauHoiCha | uniqueidentifier | Khóa ngoại tự tham chiếu (câu hỏi cha) |
| XoaTamCauHoi | bit | Đánh dấu xóa tạm |
| SoLanDuocThi | int | Số lần đã được sử dụng trong đề thi |
| SoLanDung | int | Số lần trả lời đúng |
| NgayTao | datetime | Ngày tạo |
| NgaySua | datetime | Ngày cập nhật |
| MaCLO | uniqueidentifier | Khóa ngoại đến CLO |

**Bảng CauTraLoi**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaCauTraLoi | uniqueidentifier | Khóa chính |
| MaCauHoi | uniqueidentifier | Khóa ngoại đến Câu hỏi |
| NoiDung | nvarchar(max) | Nội dung câu trả lời |
| ThuTu | int | Thứ tự |
| LaDapAn | bit | Là đáp án đúng? |
| HoanVi | bit | Cho phép hoán vị? |

**Bảng DeThi**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaDeThi | uniqueidentifier | Khóa chính |
| MaMonHoc | uniqueidentifier | Khóa ngoại đến Môn học |
| TenDeThi | nvarchar(250) | Tên đề thi |
| NgayTao | datetime | Ngày tạo |
| DaDuyet | bit | Đã được duyệt hay chưa |

**Bảng ChiTietDeThi**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaDeThi | uniqueidentifier | Khóa chính, Khóa ngoại đến Đề thi |
| MaPhan | uniqueidentifier | Khóa chính, Khóa ngoại đến Phần |
| MaCauHoi | uniqueidentifier | Khóa chính, Khóa ngoại đến Câu hỏi |
| ThuTu | int | Thứ tự câu hỏi trong đề |

**Bảng YeuCauRutTrich**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaYeuCauDe | uniqueidentifier | Khóa chính |
| HoTenGiaoVien | nvarchar(50) | Tên giáo viên yêu cầu |
| NoiDungRutTrich | nvarchar(max) | Nội dung chi tiết yêu cầu |
| NgayLay | datetime | Ngày yêu cầu |

**Bảng Files**
| Tên cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| MaFile | uniqueidentifier | Khóa chính |
| MaCauHoi | uniqueidentifier | Khóa ngoại đến Câu hỏi |
| TenFile | nvarchar(250) | Tên file |
| LoaiFile | int | Loại file |
| MaCauTraLoi | uniqueidentifier | Khóa ngoại đến Câu trả lời (nếu có) |

## 2.2.3 Thiết kế luồng xử lý

### 2.2.3.1 Luồng xử lý tạo câu hỏi và nhập liệu từ file word
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

### 2.2.3.2 Luồng xử lý rút trích đề thi
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
