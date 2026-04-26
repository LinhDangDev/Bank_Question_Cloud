# Full Rename Map — Vietnamese → English

> Source: extracted từ `database/archive/databasetable.sql` (14 user tables).
> Convention Postgres: **table = snake_case plural**, **column = snake_case singular**.
> Convention TypeScript: **class = PascalCase**, **file = kebab-case**.
> ID columns chuẩn hoá: `id` (PK uuid), `<entity>_id` (FK uuid).
> Soft-delete chuẩn: cặp `is_deleted` (boolean) + `deleted_at` (timestamptz).

---

## A. Module / folder rename

| Hiện tại (VI) | Mới (EN) |
|---|---|
| `modules/cau-hoi` | `modules/question` |
| `modules/cau-tra-loi` | `modules/answer` |
| `modules/cau-hoi-cho-duyet` | `modules/question-approval` |
| `modules/de-thi` | `modules/exam` |
| `modules/chi-tiet-de-thi` | `modules/exam-detail` |
| `modules/mon-hoc` | `modules/subject` |
| `modules/khoa` | `modules/faculty` |
| `modules/phan` | `modules/section` |
| `modules/clo` | `modules/clo` (giữ — chuẩn quốc tế) |
| `modules/yeu-cau-rut-trich` | `modules/extraction-request` |
| `modules/questions-import` | `modules/question-import` |
| `modules/word-import` | gộp vào `document-processing/word-import` |
| `modules/exam-package` | `modules/exam-package` (giữ) |
| `modules/exam-export` | `modules/exam-export` (giữ) |
| `modules/multimedia-exam` | `modules/multimedia-exam` (giữ) |

---

## B. Entity class rename

| Class hiện tại | Class mới | File mới |
|---|---|---|
| `CauHoi` | `Question` | `question.entity.ts` |
| `CauTraLoi` | `Answer` | `answer.entity.ts` |
| `CauHoiChoDuyet` | `QuestionApproval` | `question-approval.entity.ts` |
| `DeThi` | `Exam` | `exam.entity.ts` |
| `ChiTietDeThi` | `ExamDetail` | `exam-detail.entity.ts` |
| `MonHoc` | `Subject` | `subject.entity.ts` |
| `Khoa` | `Faculty` | `faculty.entity.ts` |
| `Phan` | `Section` | `section.entity.ts` |
| `CLO` | `CLO` | `clo.entity.ts` |
| `YeuCauRutTrich` | `ExtractionRequest` | `extraction-request.entity.ts` |
| `Files` | `File` | `file.entity.ts` |
| `User` | `User` | `user.entity.ts` |
| `AuditLog` | `AuditLog` | `audit-log.entity.ts` |
| `Notification` | `Notification` | `notification.entity.ts` |

---

## C. Table rename (MSSQL → Postgres)

| MSSQL | Postgres |
|---|---|
| `CauHoi` | `questions` |
| `CauTraLoi` | `answers` |
| `CauHoiChoDuyet` | `question_approvals` |
| `DeThi` | `exams` |
| `ChiTietDeThi` | `exam_details` |
| `MonHoc` | `subjects` |
| `Khoa` | `faculties` |
| `Phan` | `sections` |
| `CLO` | `clos` |
| `YeuCauRutTrich` | `extraction_requests` |
| `Files` | `files` |
| `User` | `users` |
| `AuditLog` | `audit_logs` |
| `Notification` | `notifications` |

---

## D. Column rename — full (14 tables)

### D.1 `AuditLog` → `audit_logs`

| MSSQL column | Type | Postgres column | Type |
|---|---|---|---|
| `MaNhatKy` | bigint IDENTITY | `id` | bigserial PK |
| `TenBang` | nvarchar(100) | `table_name` | varchar(100) |
| `MaBanGhi` | nvarchar(50) | `record_id` | varchar(50) |
| `HanhDong` | nvarchar(20) | `action` | varchar(20) |
| `GiaTriCu` | nvarchar(max) | `old_value` | text/jsonb |
| `GiaTriMoi` | nvarchar(max) | `new_value` | text/jsonb |
| `MaNguoiDung` | uniqueidentifier | `user_id` | uuid |
| `TenNguoiDung` | nvarchar(255) | `user_name` | varchar(255) |
| `ThoiGianThucHien` | datetime | `performed_at` | timestamptz |
| `DiaChiIP` | nvarchar(45) | `ip_address` | varchar(45) |
| `UserAgent` | nvarchar(500) | `user_agent` | varchar(500) |
| `Notes` | nvarchar(max) | `notes` | text |

### D.2 `CauHoi` → `questions`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaCauHoi` | uniqueidentifier | `id` | uuid PK |
| `MaPhan` | uniqueidentifier | `section_id` | uuid FK |
| `MaSoCauHoi` | int | `question_code` | int | mã số nghiệp vụ (không phải PK) |
| `NoiDung` | nvarchar(max) | `content` | text |
| `HoanVi` | bit | `shuffle_answers` | boolean |
| `CapDo` | smallint | `difficulty_level` | smallint |
| `SoCauHoiCon` | int | `child_question_count` | int |
| `DoPhanCachCauHoi` | float | `discrimination_index` | double precision |
| `MaCauHoiCha` | uniqueidentifier | `parent_question_id` | uuid |
| `XoaTamCauHoi` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | **giữ cả 2**: `is_deleted` cho UI hide, `deleted_at` cho audit log thời gian xoá |
| `SoLanDuocThi` | int | `times_used` | int |
| `SoLanDung` | int | `times_correct` | int |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `NgaySua` | datetime | `updated_at` | timestamptz |
| `MaCLO` | uniqueidentifier | `clo_id` | uuid FK |
| `DoKhoThucTe` | float | `actual_difficulty` | double precision |
| `NguoiTao` | uniqueidentifier | `created_by` | uuid FK NOT NULL |

### D.3 `CauHoiChoDuyet` → `question_approvals`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaCauHoiChoDuyet` | uniqueidentifier | `id` | uuid PK |
| `MaPhan` | uniqueidentifier | `section_id` | uuid |
| `MaSoCauHoi` | nvarchar(50) | `question_code` | varchar(50) | mã số nghiệp vụ (không phải PK) |
| `NoiDung` | nvarchar(max) | `content` | text |
| `HoanVi` | bit | `shuffle_answers` | boolean |
| `CapDo` | int | `difficulty_level` | int |
| `SoCauHoiCon` | int | `child_question_count` | int |
| `DoPhanCachCauHoi` | nvarchar(max) | `discrimination_index` | text *(legacy stringified)* |
| `MaCauHoiCha` | uniqueidentifier | `parent_question_id` | uuid |
| `XoaTamCauHoi` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | giữ cả 2 |
| `SoLanDuocThi` | int | `times_used` | int |
| `SoLanDung` | int | `times_correct` | int |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `NgaySua` | datetime | `updated_at` | timestamptz |
| `MaCLO` | uniqueidentifier | `clo_id` | uuid |
| `NguoiTao` | uniqueidentifier | `created_by` | uuid NOT NULL |
| `GhiChu` | nvarchar(max) | `notes` | text |
| `TrangThai` | int | `status` | int (enum) |
| `NguoiDuyet` | uniqueidentifier | `approved_by` | uuid |
| `NgayDuyet` | datetime | `approved_at` | timestamptz |
| `DuLieuCauTraLoi` | nvarchar(max) | `answers_data` | jsonb |
| `DuLieuCauHoiCon` | nvarchar(max) | `child_questions_data` | jsonb |

### D.4 `CauTraLoi` → `answers`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaCauTraLoi` | uniqueidentifier | `id` | uuid PK |
| `MaCauHoi` | uniqueidentifier | `question_id` | uuid FK |
| `NoiDung` | nvarchar(max) | `content` | text |
| `ThuTu` | int | `order_index` | int |
| `LaDapAn` | bit | `is_correct` | boolean |
| `HoanVi` | bit | `shuffle` | boolean |

### D.5 `ChiTietDeThi` → `exam_details`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaDeThi` | uniqueidentifier | `exam_id` | uuid FK PK |
| `MaPhan` | uniqueidentifier | `section_id` | uuid FK PK |
| `MaCauHoi` | uniqueidentifier | `question_id` | uuid FK PK |
| `ThuTu` | int | `order_index` | int |

### D.6 `CLO` → `clos`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaCLO` | uniqueidentifier | `id` | uuid PK |
| `TenCLO` | nvarchar(250) | `name` | varchar(250) |
| `MoTa` | nvarchar(max) | `description` | text |
| `ThuTu` | int | `order_index` | int |
| `XoaTamCLO` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | giữ cả 2 |
| `MaMonHoc` | uniqueidentifier | `subject_id` | uuid FK |

### D.7 `DeThi` → `exams`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaDeThi` | uniqueidentifier | `id` | uuid PK |
| `MaMonHoc` | uniqueidentifier | `subject_id` | uuid FK |
| `TenDeThi` | nvarchar(250) | `name` | varchar(250) |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `DaDuyet` | bit | `is_approved` | boolean |
| `NguoiTao` | nvarchar(255) | `created_by` | uuid NOT NULL | ETL bắt buộc lookup `users.username` → `users.id`. Fail loudly nếu không resolve được (quy trình import luôn gán user, không có row null). |
| `SoCauHoi` | int | `question_count` | int |
| `LoaiBoChuongPhan` | bit | `exclude_chapter_section` | boolean |

### D.8 `Files` → `files`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaFile` | uniqueidentifier | `id` | uuid PK |
| `MaCauHoi` | uniqueidentifier | `question_id` | uuid FK |
| `TenFile` | nvarchar(250) | `file_name` | varchar(250) |
| `LoaiFile` | int | `file_type` | int (enum) |
| `MaCauTraLoi` | uniqueidentifier | `answer_id` | uuid FK |

### D.9 `Khoa` → `faculties`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaKhoa` | uniqueidentifier | `id` | uuid PK |
| `TenKhoa` | nvarchar(250) | `name` | varchar(250) |
| `XoaTamKhoa` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | giữ cả 2 |
| `NgaySua` | datetime | `updated_at` | timestamptz |
| `NgayTao` | datetime | `created_at` | timestamptz |

### D.10 `MonHoc` → `subjects`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaMonHoc` | uniqueidentifier | `id` | uuid PK |
| `MaKhoa` | uniqueidentifier | `faculty_id` | uuid FK |
| `MaSoMonHoc` | nvarchar(50) | `code` | varchar(50) |
| `TenMonHoc` | nvarchar(250) | `name` | varchar(250) |
| `XoaTamMonHoc` | bit | `is_deleted` | boolean | đã có sẵn `NgayXoa` → map thẳng |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `NgayXoa` | datetime | `deleted_at` | timestamptz |
| `NgaySua` | datetime | `updated_at` | timestamptz |

### D.11 `Notification` → `notifications`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaThongBao` | uniqueidentifier | `id` | uuid PK |
| `MaNguoiDung` | uniqueidentifier | `user_id` | uuid FK |
| `TieuDe` | nvarchar(255) | `title` | varchar(255) |
| `NoiDung` | nvarchar(max) | `content` | text |
| `LoaiThongBao` | nvarchar(50) | `type` | varchar(50) |
| `BangLienQuan` | nvarchar(100) | `related_table` | varchar(100) |
| `MaLienQuan` | nvarchar(50) | `related_id` | varchar(50) |
| `DaDoc` | bit | `is_read` | boolean |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `NgayDoc` | datetime | `read_at` | timestamptz |

### D.12 `Phan` → `sections`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaPhan` | uniqueidentifier | `id` | uuid PK |
| `MaMonHoc` | uniqueidentifier | `subject_id` | uuid FK |
| `TenPhan` | nvarchar(250) | `name` | varchar(250) |
| `NoiDung` | nvarchar(max) | `content` | text |
| `ThuTu` | int | `order_index` | int |
| `SoLuongCauHoi` | int | `question_count` | int |
| `MaPhanCha` | uniqueidentifier | `parent_section_id` | uuid |
| `MaSoPhan` | int | `section_code` | int |
| `XoaTamPhan` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | giữ cả 2 |
| `LaCauHoiNhom` | bit | `is_question_group` | boolean |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `NgaySua` | datetime | `updated_at` | timestamptz |

### D.13 `User` → `users`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaNguoiDung` | uniqueidentifier | `id` | uuid PK |
| `TenDangNhap` | nvarchar(100) | `username` | varchar(100) UNIQUE |
| `Email` | nvarchar(100) | `email` | varchar(100) UNIQUE |
| `HoTen` | nvarchar(255) | `full_name` | varchar(255) |
| `MatKhau` | nvarchar(128) | `password_hash` | varchar(255) |
| `NgayTao` | datetime | `created_at` | timestamptz |
| `DaXoa` | bit | `is_deleted` + `deleted_at` | boolean + timestamptz | giữ cả 2 |
| `BiKhoa` | bit | `is_locked` | boolean |
| `NgayHoatDongCuoi` | datetime | `last_active_at` | timestamptz |
| `NgayDangNhapCuoi` | datetime | `last_login_at` | timestamptz |
| `NgayDoiMatKhauCuoi` | datetime | `last_password_change_at` | timestamptz |
| `NgayKhoaCuoi` | datetime | `last_locked_at` | timestamptz |
| `SoLanNhapSaiMatKhau` | int | `failed_login_count` | int |
| `BatDauKhoangThoiGianNhapSai` | datetime | `failed_login_window_start` | timestamptz |
| `SoLanTraLoiSai` | int | `failed_answer_count` | int |
| `BatDauKhoangThoiGianTraLoiSai` | datetime | `failed_answer_window_start` | timestamptz |
| `MuoiMatKhau` | nvarchar(255) | `password_salt` | varchar(255) |
| `GhiChu` | ntext | `notes` | text |
| `LaNguoiDungHeThong` | bit | `is_system_user` | boolean |
| `MaKhoa` | uniqueidentifier | `faculty_id` | uuid FK |
| `CanDoiMatKhau` | bit | `must_change_password` | boolean |

### D.14 `YeuCauRutTrich` → `extraction_requests`

| MSSQL | Type | Postgres | Type |
|---|---|---|---|
| `MaYeuCauDe` | uniqueidentifier | `id` | uuid PK |
| `HoTenGiaoVien` | nvarchar(50) | `teacher_name` | varchar(50) |
| `NoiDungRutTrich` | nvarchar(max) | `extraction_content` | text |
| `NgayLay` | datetime | `requested_at` | timestamptz |

---

## E. API route rename

| Hiện tại | Mới |
|---|---|
| `/cau-hoi` | `/questions` |
| `/cau-tra-loi` | `/answers` |
| `/cau-hoi-cho-duyet` | `/question-approvals` |
| `/de-thi` | `/exams` |
| `/chi-tiet-de-thi` | `/exam-details` |
| `/mon-hoc` | `/subjects` |
| `/khoa` | `/faculties` |
| `/phan` | `/sections` |
| `/yeu-cau-rut-trich` | `/extraction-requests` |
| `/questions-import` | `/question-import` |

NestJS giữ alias 2 tuần: `@Controller(['questions', 'cau-hoi'])`.

---

## F. Common type mappings (apply across all entities)

| MSSQL | TypeORM (vendor-neutral) | Postgres | Note |
|---|---|---|---|
| `uniqueidentifier` | `@PrimaryGeneratedColumn('uuid')` / `type: 'uuid'` | `uuid` | bỏ `NEWID()`, dùng `@Generated('uuid')` |
| `nvarchar(N)` | `type: 'varchar', length: N` | `varchar(N)` | |
| `nvarchar(max)` / `ntext` | `type: 'text'` | `text` | |
| `bit` | `type: 'boolean'` | `boolean` | |
| `datetime` / `datetime2` | `type: 'timestamp with time zone'` | `timestamptz` | luôn dùng `timestamptz` |
| `int` | `type: 'int'` | `integer` | |
| `bigint IDENTITY` | `@PrimaryGeneratedColumn('increment', { type: 'bigint' })` | `bigserial` | |
| `float` | `type: 'double precision'` | `double precision` | |
| `smallint` | `type: 'smallint'` | `smallint` | |
| `GETDATE()` | `@CreateDateColumn()` / `CURRENT_TIMESTAMP` | | |
| `XoaTam*` (bit) | `is_deleted` (boolean) → cân nhắc đổi `deleted_at` (timestamptz) cho soft-delete chuẩn | | |

---

## G. ETL strategy (P5)

ETL script (Python hoặc `pgloader` config) cần map column theo file này. Ví dụ:

```sql
-- mssql -> postgres ETL (per table)
INSERT INTO questions (id, section_id, question_code, content, shuffle_answers, ...)
SELECT MaCauHoi, MaPhan, MaSoCauHoi, NoiDung,
       CAST(HoanVi AS BIT)::boolean, ...
FROM mssql.dbo.CauHoi;
```

Generate template ETL từ file này: 1 SELECT/INSERT pair / table.

---

## H. Stats

- Tables: **14**
- Columns total: **~125**
- Module folder rename: **11**
- Entity class rename: **10** (4 giữ nguyên: User, AuditLog, Notification, CLO)
- API route rename: **10**

---

## I. Naming decisions — ĐÃ CHỐT

1. ✅ **Soft-delete**: giữ **CẢ 2** cột.
   - `is_deleted` (boolean, default false) — flag để UI ẩn record nhanh, dễ index.
   - `deleted_at` (timestamptz, nullable) — log thời điểm xoá cho audit.
   - Quy ước: khi xoá → `UPDATE ... SET is_deleted = true, deleted_at = NOW()`. Restore → reset cả 2 về `false / NULL`.
   - Áp dụng cho: `questions`, `question_approvals`, `clos`, `faculties`, `sections`, `users`. (`subjects` đã có sẵn `NgayXoa` → map thẳng `deleted_at`.)

2. ✅ **`MaSoCauHoi`** → **`question_code`** (mã số nghiệp vụ của câu hỏi, không phải PK).
   - User đã chốt đổi từ `id_questions` → `question_code` để tránh confuse với PK `id` và FK `question_id` ở các bảng khác.
   - PK của `questions` và `question_approvals` vẫn là `id` (uuid).

3. ✅ **`DeThi.NguoiTao`** → `created_by` **uuid NOT NULL**.
   - Quy trình import luôn gán user → không có record null.
   - ETL bắt buộc lookup `users.username` → `users.id`. Nếu không resolve được → **fail ETL** (không silent NULL, không cột legacy).
   - Trước khi chạy ETL: viết script verify `SELECT DISTINCT NguoiTao FROM DeThi WHERE NguoiTao NOT IN (SELECT TenDangNhap FROM [User])` — phải trả về 0 row.

4. ✅ **`HoanVi`** → `shuffle_answers` (ở `questions`), `shuffle` (ở `answers`).

---

**Author**: Generated từ `database/archive/databasetable.sql`.
**Date**: 2026-04-27
**Used by**: P3.0 (folder/class rename), P4 (column override), P5 (Postgres schema + ETL).
