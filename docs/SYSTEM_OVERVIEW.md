# System Overview — Graduation Project

> **Mục đích**: cung cấp mental model đủ để bất kỳ dev nào hiểu hệ thống trong 30 phút đọc, **trước khi** đụng vào code hay migrate.

---

## 1. Hệ thống làm gì

Hệ thống **Question Bank & Exam Management** của HUTECH (đồ án tốt nghiệp). Gồm 2 ứng dụng logic dùng chung 1 codebase backend:

- **App A — Question Bank**: giáo viên import câu hỏi từ Word, quản lý ngân hàng câu hỏi, gửi duyệt.
- **App B — Exam Management**: trưởng bộ môn chọn ma trận đề, sinh tự động đề thi, export PDF/DOCX theo template HUTECH.

### Stakeholders

| Vai trò | Quyền chính |
|---|---|
| **Admin** | Toàn quyền: user, khoa, môn học, duyệt, cấu hình |
| **Trưởng bộ môn** | Duyệt câu hỏi, tạo ma trận đề, sinh đề thi |
| **Giáo viên** | Import câu hỏi vào ngân hàng cá nhân, gửi duyệt, xem đề đã duyệt |

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite, MUI/AntD/Radix, Tailwind, KaTeX/MathLive (math), React Quill (rich text) |
| **Backend** | NestJS (TypeScript), Bun runtime, TypeORM |
| **DB** | SQL Server 2019+ (sẽ migrate Postgres — xem `REFACTOR_PLAN_DETAILED.md`) |
| **Auth** | JWT + Passport, role-based (Admin/Teacher) |
| **File processing** | Python scripts (`python-docx` v2) — parse Word, extract multimedia |
| **Queue** | Bull + Valkey/Redis OSS |
| **Storage** | DigitalOcean Spaces (S3-compatible) |
| **Search (planned)** | Qdrant (vector search cho câu hỏi tương tự) |
| **Monitoring** | Prometheus + Grafana |
| **Containers** | Docker + docker-compose |

---

## 3. Domain model (bounded contexts)

```
┌─────────────────────────────────────────────────────────────┐
│  Identity                                                    │
│  Users (Admin/Teacher)  ←  AuditLog  ←  Notifications        │
└─────────────────────────────────────────────────────────────┘
              │ created_by
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Academic Catalog                                            │
│  Faculty (Khoa) ─┬─ Subject (MonHoc) ─┬─ Section (Phan)      │
│                  └─ CLO ──────────────┘   (chapter/section)  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Question Bank                                               │
│  Section ─→ Question (CauHoi) ─→ Answer (CauTraLoi)          │
│                  │                                            │
│                  ├─→ Files (image/audio attached)             │
│                  ├─→ parent_question_id (group questions)     │
│                  └─→ CLO link                                 │
│                                                              │
│  QuestionApproval (CauHoiChoDuyet) — staging trước khi duyệt │
│   → status: pending/approved/rejected                        │
│   → on approve: copy to Question table                       │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Exam Management                                             │
│  ExtractionRequest (YeuCauRutTrich) — yêu cầu sinh đề        │
│   ↓                                                          │
│  Exam (DeThi) ─→ ExamDetail (ChiTietDeThi) ─→ Question       │
│   ↓                                                          │
│  ExamPackage — gộp nhiều đề (cho 1 lớp)                      │
│   ↓                                                          │
│  Export: PDF / DOCX (HUTECH template) / multimedia bundle    │
└─────────────────────────────────────────────────────────────┘
```

### Key concepts

- **Hierarchical question**: 1 câu hỏi có thể có `parent_question_id` → câu hỏi nhóm (group question, ví dụ "đọc đoạn văn rồi trả lời 5 câu").
- **`is_question_group` ở Section**: flag cho biết section chứa câu hỏi nhóm đặc biệt.
- **CLO (Course Learning Outcome)**: chuẩn đầu ra môn học, mỗi câu hỏi link 1 CLO.
- **Difficulty matrix**: khi sinh đề, dùng ma trận `(CLO × difficulty_level × count)` để pick câu hỏi.
- **Soft delete**: `is_deleted` (UI hide) + `deleted_at` (audit timestamp). Xem `RENAME_MAP.md` §I.1.

---

## 4. Module map (backend hiện tại)

### Aggregate domain modules

```
modules/
├── identity/
│   ├── auth/                  JWT, login, refresh
│   ├── users/                 User CRUD
│   └── audit-log/             Cross-cutting audit
│
├── academic/
│   ├── khoa/                  → faculty (sẽ rename)
│   ├── mon-hoc/               → subject
│   ├── phan/                  → section
│   └── clo/                   CLO
│
├── question-bank/
│   ├── cau-hoi/               → question
│   ├── cau-tra-loi/           → answer
│   ├── cau-hoi-cho-duyet/     → question-approval
│   └── questions-import/      → question-import (Word → DB)
│
├── exam/
│   ├── de-thi/                → exam
│   ├── chi-tiet-de-thi/       → exam-detail
│   ├── exam-package/          (đã EN)
│   ├── exam-export/           PDF/DOCX export
│   ├── exam-word-export/      Word-specific export
│   ├── multimedia-exam/       Exam with audio/image
│   └── yeu-cau-rut-trich/     → extraction-request
│
└── document-processing/  (sẽ consolidate ở P2)
    ├── enhanced-docx-parser/
    ├── python-docx-parser/
    ├── python-enhanced-docx-parser/
    ├── question-parser/
    └── word-import/
```

### Cross-cutting / infrastructure

```
infrastructure/  (sẽ tạo ở P3)
├── files/                  Upload/storage
├── integration/            External API contract
├── notification/           Email/push
├── monitoring/             Prometheus
└── queue/                  Bull
```

---

## 5. Critical data flows

### 5.1 Import câu hỏi từ Word

```
Teacher upload .docx
   ↓
[FilesModule] save to Spaces, lưu metadata
   ↓
[QuestionsImportModule] enqueue Bull job
   ↓
[Worker] spawn Python (python-docx v2)
   ↓
parse → extract: text, equations (LaTeX), images, audio
   ↓
[QuestionParserService] convert text → structured Q (parent/child, answers)
   ↓
[CauHoiChoDuyetService] insert vào staging table với status=pending
   ↓
Notification gửi cho Trưởng bộ môn
```

**Critical files**:
- Parser logic: 5 service đang trùng (xem `REFACTOR_PLAN_DETAILED.md` P2.1)
- Sample input: `sample_word_files/*.docx`
- Templates: `templates/Question_Template_Basic.md`, `Group_Question_Template.md`, `Fill_In_Blank_Template.md`

### 5.2 Duyệt câu hỏi

```
Trưởng bộ môn xem CauHoiChoDuyet
   ↓
APPROVE → copy fields sang CauHoi table, set approved_by + approved_at
REJECT  → set status=rejected, gửi notification về teacher kèm lý do
```

### 5.3 Sinh đề thi

```
Admin/Trưởng BM tạo ExtractionRequest:
   - subject_id
   - matrix: [{ clo_id, difficulty_level, count }, ...]
   - exclude_chapter_section: true/false
   ↓
[ExamService] random pick câu hỏi theo matrix
   - filter: same subject, not deleted, approved only
   - balance: spread theo CLO
   ↓
INSERT Exam row + N rows ChiTietDeThi (mapping question_id → order)
   ↓
[ExamExportService] render template HUTECH:
   - DocxTemplateService: docx-template với placeholder {{cauHoi}}, {{dapAn}}
   - PdfService: convert .docx → .pdf
   - MultimediaExam: bundle audio/image vào zip
   ↓
upload to Spaces, return signed URL
```

**Templates**: `template/TemplateHutechOffical.dotx`, `template/DeThiMau/`

### 5.4 Authentication

```
POST /auth/login → JWT (access 15m + refresh 7d)
   ↓
Mọi request: header Authorization: Bearer <token>
   ↓
Guard: JwtAuthGuard + RolesGuard (decorator @Roles)
   ↓
Failed login: increment failed_login_count, lock after N fails (BiKhoa)
```

---

## 6. Database schema overview

14 user tables — xem chi tiết tại `RENAME_MAP.md` §C, §D.

### Key relationships

```
Faculty (Khoa) 1─N Subject (MonHoc) 1─N Section (Phan) 1─N Question (CauHoi)
                                             │                    │
                                             │                    ├─N Answer
                                             │                    ├─N Files
                                             │                    └── parent_question_id (self-ref)
                                             │
Subject 1─N CLO ←─────────────────── Question.clo_id

Subject 1─N Exam (DeThi)
Exam     N─N Question  (qua ExamDetail composite key: exam_id + section_id + question_id)

User (system_user / teacher) ─→ created_by trong Question, Exam, AuditLog, Notification
```

### MSSQL specifics đang dùng (sẽ gỡ ở P4)

- `uniqueidentifier` PK với `NEWID()` default
- `nvarchar(max)` cho rich content
- `bit` cho boolean
- `datetime` (sẽ chuyển `timestamptz`)
- Raw SQL với `SELECT TOP 1`, `ISNULL`, `GETDATE()` ở `questions-import.service` và `cau-hoi-cho-duyet.service`

### Stored procedures / triggers

✅ Repo không chứa. **Cần verify trên DB production** bằng query ở `REFACTOR_PLAN_DETAILED.md` P0.1.

---

## 7. Glossary VI ↔ EN (quick reference)

| VI (code hiện tại) | EN (sau migrate) | Nghĩa |
|---|---|---|
| `cau-hoi` / `CauHoi` | `question` / `Question` | Câu hỏi |
| `cau-tra-loi` / `CauTraLoi` | `answer` / `Answer` | Câu trả lời (option) |
| `cau-hoi-cho-duyet` | `question-approval` | Câu hỏi chờ duyệt (staging) |
| `de-thi` / `DeThi` | `exam` / `Exam` | Đề thi |
| `chi-tiet-de-thi` | `exam-detail` | Mapping đề ↔ câu hỏi |
| `mon-hoc` / `MonHoc` | `subject` / `Subject` | Môn học |
| `khoa` / `Khoa` | `faculty` / `Faculty` | Khoa |
| `phan` / `Phan` | `section` / `Section` | Phần/chương trong môn |
| `yeu-cau-rut-trich` | `extraction-request` | Yêu cầu sinh đề |
| `MaSoCauHoi` | `question_code` | Mã số nghiệp vụ câu hỏi (không phải PK) |
| `NoiDung` | `content` | Nội dung |
| `HoanVi` | `shuffle_answers` / `shuffle` | Hoán vị đáp án |
| `CapDo` | `difficulty_level` | Cấp độ khó (1-5) |
| `SoLanDuocThi` | `times_used` | Số lần được sử dụng |
| `SoLanDung` | `times_correct` | Số lần trả lời đúng |
| `DoPhanCachCauHoi` | `discrimination_index` | Chỉ số phân cách (psychometric) |
| `DoKhoThucTe` | `actual_difficulty` | Độ khó thực tế (tính từ stats) |
| `XoaTam*` | `is_deleted` + `deleted_at` | Soft delete |
| `NgayTao` / `NgaySua` | `created_at` / `updated_at` | Timestamps |
| `NguoiTao` / `NguoiDuyet` | `created_by` / `approved_by` | User FK |
| `TrangThai` | `status` | Trạng thái duyệt (enum) |

→ Map đầy đủ tại `RENAME_MAP.md` §D.

---

## 8. Known tech debt (đã được mapping vào refactor plan)

| # | Vấn đề | Phase fix |
|---|---|---|
| 1 | 8 service parser DOCX trùng chức năng | P2 |
| 2 | `src/services/` 22 file global thay vì module-owned | P3 |
| 3 | `src/controllers/` 5 controller parser đứng ngoài module | P3 |
| 4 | `src/dto/` & `src/entities/` tập trung — vi phạm cohesion | P3 |
| 5 | 28 module folder, không nhóm theo bounded context | P3 |
| 6 | Không có repository layer rõ ràng | P3 |
| 7 | MSSQL coupling: entity types, raw SQL, NEWID() | P4 |
| 8 | Migration `database/migrations/*.sql` viết tay, không portable | P4 |
| 9 | Domain naming tiếng Việt không nhất quán với infra English | P3.0 |
| 10 | `files` god-module: 3 controller + 5 service | P3.6 |
| 11 | `de-thi` ôm 5 service + 7 entity | P3.7 |
| 12 | Dead code: `python-word-processor.service.ts` trỏ file không tồn tại | P1 |
| 13 | `src/utils/db-env-switcher.ts` mix dev tool vào prod | P1 |

---

## 9. Where to find what

| Cần tìm | Vị trí |
|---|---|
| Schema DB hiện tại | `database/archive/databasetable.sql` (gitignored, full dump) |
| Sample Word input | `sample_word_files/*.docx` |
| Template export | `template/TemplateHutechOffical.dotx`, `template/DeThiMau/` |
| Python parser scripts | `scripts/*.py` (60 file, sẽ dọn ở P6) |
| Migration TypeScript | `backend/database/migrations/` |
| Env config example | `backend/.env.example` |
| Docker Compose | `docker-compose.yml` (dev), `docker-compose.production.yml` |
| Smoke test frontend | `frontend/tests/smoke.spec.ts` |
| API docs | `http://localhost:3001/api` (Swagger) khi chạy `bun run swagger` |

---

## 10. Operational notes

### Local dev setup

```bash
# 1. SQL Server: docker-compose up -d sqlserver (hoặc dùng remote server)
# 2. Backend
cd backend && bun install && bun run setup:env && bun run db:switch && bun run dev
# 3. Frontend
cd frontend && bun install && bun run dev
```

### Common commands

```bash
bun run db:switch        # đổi giữa local / server DB
bun run db:test          # test connection
bun run swagger          # serve OpenAPI doc
bun run test:e2e         # full integration test
```

### Database environments

- `local`: SQL Server container, port 1433
- `server`: production HUTECH SQL Server (yêu cầu VPN)
- Switch bằng `db-env-switcher` (sẽ move vào `scripts/dev/` ở P1)

---

## 11. Decision log (điểm quan trọng)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-27 | Migrate Postgres (không chỉ portable) | Vendor lock-in cao, Postgres OSS rẻ + mạnh hơn cho json/full-text |
| 2026-04-27 | Rename toàn bộ sang English | Onboarding dev mới, mental model nhất quán với infra layer |
| 2026-04-27 | Soft-delete dùng cặp `is_deleted` + `deleted_at` | Bool cho UI nhanh, timestamp cho audit |
| 2026-04-27 | Module-first practical (không full DDD) | Giảm churn, đủ sạch để scale team |
| 2026-04-27 | Giữ MSSQL dual-run trong P5 trước khi cutover | Rollback safety, shadow read 5% diff log 1 tuần |

---

## 12. Open questions (chưa quyết định)

- Có cần **role thứ 3** (Examiner/Reviewer riêng biệt với Trưởng bộ môn)?
- Question versioning: khi edit câu hỏi đã từng dùng trong đề thi → giữ snapshot hay update in-place? (Hiện tại đang update in-place, có thể gây lệch điểm số.)
- Multi-tenant: hiện tại single-tenant, có cần chuẩn bị multi-tenant ở schema level không?

---

**Last updated**: 2026-04-27
**Next review**: sau khi P0 verify DB production xong.
