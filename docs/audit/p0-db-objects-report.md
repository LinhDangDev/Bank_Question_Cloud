# P0.1 — DB Objects Audit Report

> **Source**: `database/archive/databasetable.sql` (637 KB, last modified 2025-08-11)
> **Method**: Static scan dump file (DB live đã bị xoá; chỉ còn dump).
> **Date**: 2026-04-27

## TL;DR

| Object | Count | Status |
|---|---:|---|
| **Tables** | 14 user tables | ✅ Match `RENAME_MAP.md` §C |
| **Stored procedures** | **161** | ⚠️ Legacy CRUD-style + 4 business logic — KHÔNG được app gọi |
| **Triggers** | 0 | ✅ Không có |
| **Views** | 0 | ✅ Không có |
| **Functions** | 0 | ✅ Không có |
| **Indexes (non-PK)** | 35 | ✅ Cần preserve khi sang Postgres |
| **Foreign keys** | 19 | ✅ Cần preserve |
| **Default constraints** | 37 | ⚠️ Phải convert MSSQL syntax (`NEWID()`, `GETDATE()`) sang Postgres |
| **Check constraints** | 40 | ✅ Cần copy nguyên |

---

## 1. Stored procedures (161 total)

### Phân bố theo prefix

| Prefix | Count | Ghi chú |
|---|---:|---|
| `CauHoi_*` | 26 | CRUD + export, **app KHÔNG gọi** |
| `Phan_*` | 21 | CRUD section |
| `Question_*` | 19 | CRUD (capitalized) — dup của `CauHoi_*`, **legacy** |
| `MonHoc_*` | 15 | CRUD subject |
| `CauTraLoi_*` | 11 | CRUD answer |
| `CLO_*` | 11 | CRUD CLO |
| `SP_*` | 11 | Utility procs |
| `Files_*` | 10 | CRUD files |
| `Khoa_*` | 10 | CRUD faculty |
| `ChiTietDeThi_*` | 8 | CRUD exam-detail |
| `DeThi_*` | 8 | CRUD exam |
| `YeuCauRutTrich_*` | 7 | CRUD extraction-request |
| **Business logic** | **4** | **Cần verify khi nào chạy — xem §1.1** |

→ Full list: [`p0-procedures-list.txt`](./p0-procedures-list.txt)

### 1.1 Business logic procedures (cần điều tra)

| Procedure | Mô tả (suy diễn từ tên) | Risk |
|---|---|---|
| `CalculateDiscriminationIndex` | Update `CauHoi.DoPhanCachCauHoi` từ `QuestionDiscriminationStats` (table không có trong dump → có thể là computed/external) | **HIGH** — column app đọc, nếu không chạy → data stale |
| `UpdateRealDifficulty` | Update `CauHoi.DoKhoThucTe` (actual_difficulty) | **HIGH** — same issue |
| `UpdateQuestionStatsFromExam` | Update `SoLanDuocThi`, `SoLanDung` từ kết quả thi | **MEDIUM** — chạy sau mỗi đợt thi |
| `ExtractExamWithRealDifficulty` | Sinh đề có dùng độ khó thực tế | **MEDIUM** — có thể là alternative cho extraction logic của TS |

### 1.2 Verify backend không gọi proc

```
grep "EXEC|EXECUTE" backend/src/**/*.ts → 5 matches
```

Tất cả 5 match đều là JavaScript context (`Promise.exec()`, `executePythonScript()`, `regex.exec()`, `ExecutionContext`) — **KHÔNG có SQL EXEC**.

✅ **Confirmed: backend code không depend vào bất kỳ stored procedure nào.**

---

## 2. Open questions cần user trả lời

1. **`CalculateDiscriminationIndex` + `UpdateRealDifficulty`**: hiện tại đang được trigger bằng cách nào?
   - SQL Agent Job? (không thể verify từ dump)
   - Manual run định kỳ?
   - Hay đã không chạy từ lâu → column `DoPhanCachCauHoi`/`DoKhoThucTe` đang stale?
   - **Action**: nếu đang dùng → port logic sang TS service. Nếu không → drop column hoặc compute on-demand.

2. **`UpdateQuestionStatsFromExam`**: có cần thiết không?
   - Field `SoLanDuocThi`/`SoLanDung` (`times_used`/`times_correct`) đang là counter thủ công.
   - Modern approach: tính từ table `ExamResult`/`Answer` on-demand (view hoặc materialized view).

3. **`ExtractExamWithRealDifficulty`**: có thay thế logic TS hiện tại không?
   - Hiện tại `ExamPackageService` ở TS làm extraction.
   - Có 2 logic song song?

4. **161 procedures legacy**: confirm có ai chạy chúng từ ngoài app (BI tools, Excel, third-party) không? Nếu không → **DROP toàn bộ** khi sang Postgres.

---

## 3. Indexes (35) — cần preserve

Các index non-PK quan trọng cần migration sang Postgres. Sẽ được liệt kê chi tiết khi viết Postgres DDL ở P5.

**Action P4.4**: TypeORM migration sẽ sinh `CREATE INDEX` portable. Verify từng index có đủ cột.

## 4. Foreign keys (19)

Đã được capture trong entity decorators TS. ON DELETE/ON UPDATE behavior cần verify từng cái khi sang Postgres.

**Risk**: MSSQL có `ON DELETE NO ACTION` mặc định, Postgres có khái niệm tương tự nhưng deferrable khác. Cần test ở P5 dual-run.

## 5. Default constraints (37) — cần convert

Các default phổ biến trong dump:
- `DEFAULT (newid())` → Postgres: `DEFAULT gen_random_uuid()` (cần extension `pgcrypto` hoặc `uuid-ossp`)
- `DEFAULT (getdate())` → Postgres: `DEFAULT now()` hoặc `DEFAULT current_timestamp`
- `DEFAULT (0)` / `DEFAULT (1)` → giữ nguyên cho int/bit; bit → boolean cần map `1 → true`, `0 → false`

**Action P4.4**: Migration script tự convert qua TypeORM column decorators.

## 6. Check constraints (40) — copy nguyên

Đa số là validation đơn giản (range, NOT NULL combos). MSSQL syntax tương thích Postgres ~95%. Sẽ verify trong P5.

---

## 7. Decision sau P0.1

✅ **Có thể migrate Postgres mà KHÔNG cần port stored procedures**, NHƯNG:
- Phải clarify 4 business logic procs (§1.1) với user trước khi cutover.
- Drop 157 CRUD procs an toàn.
- Indexes/FKs/defaults/checks port qua TypeORM migration.

## 8. P0.1 Verdict

| Check | Result |
|---|---|
| Có procedure ngoài repo? | ⚠️ Có 161 procs trong dump, nhưng **0 procs được app gọi** |
| Có trigger ngầm? | ✅ Không |
| Có job nền? | ⚠️ **Không thể verify từ dump** (msdb.sysjobs không trong file). User confirm. |
| Có view/function? | ✅ Không |
| Có computed column? | ⚠️ Cần check riêng (regex `AS \(` chưa scan) |

→ **Tiếp tục P1** với điều kiện: user confirm 4 business procs có/không được dùng + có/không có SQL Agent jobs.

---

**Next**: Generate `madge-baseline.json`, `api-baseline.json`, golden snapshot parser → cần backend deps được install (`bun install` trong `backend/`).
