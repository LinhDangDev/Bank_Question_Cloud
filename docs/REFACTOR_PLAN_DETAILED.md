# Repo Refactor Plan — Detailed (Backend + DB + Housekeeping)

> Phiên bản chi tiết hơn của `backend/REFACTOR_PLAN.md`. Mục tiêu: chuẩn hoá NestJS module-first, gỡ MSSQL coupling, chuẩn bị (không bắt buộc migrate ngay) Postgres, dọn repo root.
>
> **Quyết định đã chốt** (user xác nhận 2026-04-27):
> - Naming: **rename TOÀN BỘ sang English** (module + entity + table + column + route). Xem chi tiết tại [`RENAME_MAP.md`](./RENAME_MAP.md).
> - Entities: **practical** — giữ một số entity global ở `shared/`, còn lại co-locate theo module.
> - Mức độ: **clean module-first practical**, KHÔNG full DDD.
> - DB target: **migrate Postgres** (không chỉ portable). Giữ MSSQL chạy song song trong P5 dual-run, cutover ở P6.

---

## 0. Trình tự tổng (KHÔNG đảo)

```
P0 Verify  →  P1 Quick wins  →  P2 Parser consolidation  →
P3 Module-first refactor  →  P4 Vendor-neutral DB layer  →
P5 (optional) Postgres dual-run  →  P6 Cutover
```

Lý do: refactor app trước, DB sau. Đổi cùng lúc = không debug được.

---

## P0 — Verify thực trạng (0.5 ngày)

### P0.1 Verify DB có procedure/trigger/job ngoài repo không

Chạy trên SQL Server thật (production hoặc snapshot):

```sql
-- 1. Stored procedures (loại trừ system)
SELECT name, create_date, modify_date
FROM sys.procedures
WHERE is_ms_shipped = 0
ORDER BY modify_date DESC;

-- 2. Triggers
SELECT t.name AS trigger_name, OBJECT_NAME(t.parent_id) AS table_name,
       t.create_date, t.modify_date, t.is_disabled
FROM sys.triggers t
WHERE t.is_ms_shipped = 0;

-- 3. Functions
SELECT name, type_desc, create_date, modify_date
FROM sys.objects
WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0;

-- 4. Views
SELECT name, create_date, modify_date FROM sys.views WHERE is_ms_shipped = 0;

-- 5. SQL Agent jobs
USE msdb;
SELECT j.name, j.enabled, j.date_created, j.date_modified
FROM dbo.sysjobs j;

-- 6. Default constraints / computed columns / check constraints
SELECT OBJECT_NAME(parent_object_id) AS table_name, name, definition
FROM sys.default_constraints;
SELECT OBJECT_NAME(object_id) AS table_name, name, definition
FROM sys.check_constraints;
SELECT OBJECT_NAME(object_id) AS table_name, name, definition
FROM sys.computed_columns;

-- 7. Indexes (non-PK)
SELECT OBJECT_NAME(i.object_id) AS table_name, i.name, i.type_desc, i.is_unique
FROM sys.indexes i
WHERE i.is_primary_key = 0 AND i.type > 0
  AND OBJECTPROPERTY(i.object_id,'IsUserTable') = 1;
```

→ Lưu kết quả vào `database/audit/db_objects_<date>.md`. Nếu có procedure/trigger → **phải** export ra `database/procedures/*.sql`, `database/triggers/*.sql` trước khi refactor tiếp.

### P0.2 Snapshot dependency graph backend

```bash
cd backend
npx madge --extensions ts --circular src/        # circular deps
npx madge --extensions ts --json src/ > ../docs/audit/madge_<date>.json
npx depcruise --output-type dot src | dot -Tsvg > ../docs/audit/deps_<date>.svg
```

→ Baseline để so sánh sau refactor.

### P0.3 Snapshot test contract hiện tại

Trước khi đụng code:
- Liệt kê tất cả endpoint Swagger → `docs/audit/api_contract_baseline.md`.
- Chạy import 4 file mẫu trong `sample_word_files/` → lưu output JSON làm golden snapshot ở `backend/test/fixtures/golden/`.
- Nếu chưa có e2e: viết tối thiểu 5 smoke test (login, list cau-hoi, create de-thi, export PDF, import Word).

**Gate**: không refactor nếu chưa có golden snapshot cho parser.

---

## P1 — Quick wins (0.5 ngày, có thể merge ngay)

| # | Action | File |
|---|--------|------|
| 1 | Xoá file rỗng | `backend/src/services/questions-import.service.ts` (1 byte) — confirmed empty trong plan v1 |
| 2 | Xoá dead reference | `backend/src/services/python-word-processor.service.ts` (trỏ tới `word_processor.py` không tồn tại) |
| 3 | Move dev utility ra khỏi production | `backend/src/utils/db-env-switcher.ts` → `scripts/dev/` |
| 4 | Bỏ `DbConfigController` khỏi `AppModule` (chỉ enable khi `NODE_ENV !== 'production'`) | `@d:\Code\Graduation\backend\src\app.module.ts:96` |
| 5 | Add `madge --circular` vào CI | `.github/workflows/*.yml` |
| 6 | Add `commitlint` + `husky` (conventional commits) | `backend/package.json` |
| 7 | Move 60+ file rác ở repo root vào `archive/` hoặc xoá (đã làm Phase 1 cũ — verify lại) | repo root |
| 8 | Thống nhất 1 lockfile: chỉ giữ `pnpm-lock.yaml`, xoá các `package-lock.json`/`bun.lockb` lẻ tẻ | repo |
| 9 | Add `HealthModule` (Terminus) chuẩn: `/health`, `/health/db`, `/health/redis` | `backend/src/infrastructure/health/` |

Mỗi item = 1 commit riêng, gắn label `chore:` hoặc `refactor:`.

---

## P2 — Parser consolidation (3–5 ngày, RỦI RO CAO NHẤT)

### P2.1 Audit 8 parser hiện có

Tạo bảng `docs/audit/parser_matrix.md`:

| Service | Engine | Input | Output schema | Caller | Test? | Status |
|---|---|---|---|---|---|---|
| `services/docx-parser.service.ts` | mammoth | .docx | ? | ? | ? | legacy |
| `services/enhanced-docx-parser.service.ts` | mammoth+regex | .docx | ParsedQuestion[] | `controllers/enhanced-docx-parser.controller.ts` | ? | active |
| `services/enhanced-docx-wasm-parser.service.ts` | docx-wasm | .docx | ? | `controllers/enhanced-docx-wasm-parser.controller.ts` | ? | exp |
| `services/python-docx-parser.service.ts` | spawn python-docx | .docx | ? | `controllers/python-docx-parser.controller.ts` | ? | active |
| `services/python-enhanced-docx-parser.service.ts` | spawn python v2 | .docx | ? | `controllers/python-enhanced-docx-parser.controller.ts` | ? | active |
| `services/enhanced-question-parser.service.ts` | text→Q | string | Question[] | ? | ? | logic-only |
| `services/question-parser.service.ts` | text→Q legacy | string | Question[] | `controllers/question-parser.controller.ts` | ? | legacy |
| `services/enhanced-word-import.service.ts` | orchestrator | .docx | DB write | `modules/word-import/*` | ? | orchestrator |

Bắt buộc fill xong bảng này trước khi viết code mới.

### P2.2 Chọn 1 strategy chính

Quyết định kỹ thuật (cần trade-off rõ):
- **Mammoth (TS)**: nhẹ, không cần Python runtime. Hạn chế: equation, multimedia phức tạp.
- **Python (`python-docx` v2)**: mạnh, đã có code parse equation/image trong `scripts/`. Hạn chế: thêm runtime dependency.
- **docx-wasm**: thử nghiệm, ít maturity.

→ Đề xuất: **Python v2 = primary** (vì golden output của file mẫu phụ thuộc nó), **Mammoth = fallback** cho test/CI không có Python.

### P2.3 Module mới `document-processing`

```
backend/src/modules/document-processing/
├── document-processing.module.ts
├── docx-parser/
│   ├── docx-parser.service.ts            # orchestrator, chọn strategy
│   ├── interfaces/
│   │   ├── parser-strategy.interface.ts  # IParserStrategy.parse(buf)
│   │   └── parsed-question.interface.ts
│   ├── strategies/
│   │   ├── python-enhanced.strategy.ts
│   │   ├── mammoth.strategy.ts
│   │   └── (wasm.strategy.ts — optional)
│   ├── question-parser/
│   │   └── question-parser.service.ts    # text → structured Q
│   └── __tests__/
│       └── docx-parser.golden.spec.ts    # so với fixtures/golden/
├── word-import/
│   ├── word-import.controller.ts
│   ├── word-import.service.ts            # orchestrate parse + persist
│   └── dto/
└── exam-export/
    ├── pdf.service.ts
    ├── docx-template.service.ts
    └── exam-export.controller.ts
```

### P2.4 Migration sequence (commit-by-commit)

1. `feat(parser): introduce IParserStrategy + DocxParserService skeleton` (no caller change)
2. `feat(parser): implement python-enhanced strategy from existing service` (copy logic, không xoá cũ)
3. `feat(parser): implement mammoth strategy`
4. `test(parser): add golden snapshot tests against sample_word_files/` ← **gate**
5. `refactor(controllers): point enhanced-docx-parser controller to new service`
6. lặp lại cho 4 controller còn lại
7. `chore(parser): remove legacy parser modules + services + controllers` (1 commit lớn, có rollback link)

### P2.5 Files xoá ở P2 (sau khi caller chuyển hết)

```
backend/src/services/docx-parser.service.ts
backend/src/services/enhanced-docx-parser.service.ts
backend/src/services/enhanced-docx-wasm-parser.service.ts
backend/src/services/python-docx-parser.service.ts
backend/src/services/python-enhanced-docx-parser.service.ts
backend/src/services/enhanced-question-parser.service.ts
backend/src/services/question-parser.service.ts
backend/src/services/enhanced-word-import.service.ts
backend/src/controllers/*.ts                    (toàn bộ 5 file)
backend/src/modules/enhanced-docx-parser/
backend/src/modules/python-docx-parser/
backend/src/modules/python-enhanced-docx-parser/
backend/src/modules/question-parser/
backend/src/modules/word-import/                (gộp vào document-processing)
```

**Gate cuối P2**: golden snapshot pass 100% trên 4 file `sample_word_files/`.

---

## P3 — Module-first refactor + English rename (6–8 ngày)

### P3.0 — Rename folder + entity class (2 ngày, làm trước P3.1)

Theo [`RENAME_MAP.md`](./RENAME_MAP.md) §A, §B. Quy trình per-module (lặp 11 lần):

1. `git mv modules/<vi-name> modules/<en-name>` — giữ history.
2. IDE refactor rename class (`CauHoi` → `Question`) — auto update import.
3. Rename file kebab-case (`cau-hoi.entity.ts` → `question.entity.ts`).
4. **Giữ `@Entity({ name: 'CauHoi' })` trỏ table cũ** — app vẫn chạy MSSQL không sửa DB.
5. **Giữ `@Column({ name: 'MaCauHoi' })` cho mọi cột** — tách phase với P4.
6. Controller alias: `@Controller(['questions', 'cau-hoi'])` — backward compat 2 tuần.
7. Build + golden test pass → commit `refactor(rename): <vi> -> <en>`.

Frontend rename PR riêng, deploy sau backend 1 ngày.

### P3.1 Target tree (sau khi rename)

```
backend/src/
├── main.ts
├── app.module.ts                          # chỉ import 6 aggregate module
├── shared/
│   ├── config/   (env.validation.ts với Joi)
│   ├── database/ (datasource.ts, migration runner)
│   ├── filters/  interceptors/  guards/  decorators/  pipes/
│   ├── dto/      (pagination.dto.ts, base-response.dto.ts)
│   └── utils/
├── infrastructure/
│   ├── storage/        (spaces.service, storage.service, file-url.service)
│   ├── queue/          (Bull adapter)
│   ├── monitoring/     (Prometheus, audit interceptor)
│   ├── health/         (Terminus)
│   ├── notification/   (email, push adapters)
│   └── python-bridge/  (1 service spawn Python, dùng chung)
└── modules/
    ├── identity/                          # IdentityModule (aggregate)
    │   ├── auth/  users/  audit-log/
    │   └── identity.module.ts
    ├── academic/                          # AcademicModule
    │   ├── khoa/  mon-hoc/  phan/  clo/
    │   └── academic.module.ts
    ├── question-bank/                     # QuestionBankModule
    │   ├── cau-hoi/  cau-tra-loi/  approval/  (cau-hoi-cho-duyet rename)
    │   └── question-bank.module.ts
    ├── exam/                              # ExamModule
    │   ├── de-thi/  chi-tiet-de-thi/  exam-package/  yeu-cau-rut-trich/
    │   └── exam.module.ts
    ├── document-processing/               # đã làm ở P2
    └── integration/                       # IntegrationModule (external API)
```

### P3.2 Mỗi feature module nội bộ

```
modules/<bc>/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts          # use-case / orchestration
├── <feature>.repository.ts       # ⭐ tách query khỏi service (TypeORM custom repo)
├── dto/        create-*.dto.ts, update-*.dto.ts, query-*.dto.ts
├── entities/   (nếu domain-owned) hoặc import từ shared
└── __tests__/  *.service.spec.ts
```

### P3.3 File-by-file move map (services global)

| Hiện tại | Đích |
|---|---|
| `src/services/exam.service.ts` | `modules/exam/de-thi/de-thi.service.ts` (merge) |
| `src/services/exam-package.service.ts` | `modules/exam/exam-package/` |
| `src/services/integration.service.ts` | `modules/integration/` |
| `src/services/pdf.service.ts` | `modules/document-processing/exam-export/` |
| `src/services/media-content-processor.service.ts` | `modules/document-processing/` |
| `src/services/media-processing.service.ts` | `modules/document-processing/` |
| `src/services/spaces.service.ts` | `infrastructure/storage/` |
| `src/services/storage.service.ts` | `infrastructure/storage/` |
| `src/services/docx-template.service.ts` | `modules/document-processing/exam-export/` |
| `src/services/content-replacement.service.ts` | `modules/document-processing/` |
| `src/services/question-preview.service.ts` | `modules/question-bank/cau-hoi/` |

### P3.4 DTO co-locate

Move 18 file từ `src/dto/` về module tương ứng. **Giữ ở `shared/dto/`**: `pagination.dto.ts`, `auth.dto.ts` (token payload), tạo `base-response.dto.ts`.

### P3.5 Entities

Practical approach:
- **Giữ ở `shared/database/entities/`** các entity bị 3+ module dùng: `cau-hoi`, `de-thi`, `mon-hoc`, `users`, `files` (tránh circular).
- **Move về module**: `audit-log`, `notification`, `cau-hoi-cho-duyet`, `cau-tra-loi`, `chi-tiet-de-thi`, `clo`, `khoa`, `phan`, `yeu-cau-rut-trich`.
- Cấm tuyệt đối business logic trong entity layer.

### P3.6 Tách `files` god-module

```
infrastructure/storage/
├── object-storage.service.ts      (R2/S3/Spaces — gộp spaces.service + storage.service)
├── file-url.service.ts             (signed URL, public URL)
└── storage.module.ts

modules/files/
├── file-metadata.service.ts        (DB CRUD `Files` entity)
├── files.controller.ts
└── files.module.ts                 (import StorageModule, DocumentProcessingModule)
```

### P3.7 Tách `de-thi` quá rộng

`de-thi.module.ts` hiện inject 7 entity + 5 service → tách:
- Core: `de-thi`, `chi-tiet-de-thi`, `phan` (giữ trong ExamModule)
- Export: move `DocxTemplateService`, `PdfService` → `document-processing/exam-export/`, ExamModule chỉ `forwardRef` khi export.
- Integration: bỏ `IntegrationService` ra, dùng EventEmitter hoặc explicit injection qua interface.

### P3.8 Commit chiến lược P3

- 1 commit / 1 feature move (tổng ~25 commit nhỏ).
- Dùng **`git mv`** để giữ history.
- Sau mỗi commit: `bun run build` + `bun run test` phải pass.
- PR theo bounded context (5 PR: identity, academic, question-bank, exam, infrastructure).

---

## P4 — Vendor-neutral DB layer (3–4 ngày)

Mục đích: làm app **chạy được** trên cả MSSQL và Postgres mà không sửa code app. Chưa migrate dữ liệu.

### P4.1 Entity types — bỏ MSSQL-only

Quét và đổi:

| MSSQL-specific | Vendor-neutral |
|---|---|
| `nvarchar` | `varchar` (TypeORM map đúng theo driver) |
| `length: 'max'` | `text` |
| `uniqueidentifier` | `uuid` (TypeORM column type `uuid`) |
| `default: () => 'NEWID()'` | `@Generated('uuid')` hoặc default app-side `randomUUID()` |
| `datetime2` | `timestamp` |
| `bit` | `boolean` |

Files cần đổi (xác minh bằng grep):
```
backend/src/entities/de-thi.entity.ts
backend/src/entities/cau-hoi-cho-duyet.entity.ts
backend/src/entities/cau-hoi.entity.ts
... (toàn bộ 14 entity)
```

### P4.2 Raw SQL — strip MSSQL syntax

Hot spots:
- `modules/questions-import/questions-import.service.ts:640,657,668`
- `modules/cau-hoi-cho-duyet/cau-hoi-cho-duyet.service.ts:195,244,278,315`

Đổi:
- `SELECT TOP 1 ... ORDER BY` → `SELECT ... ORDER BY ... LIMIT 1` (Postgres) — dùng QueryBuilder `.limit(1)` để portable.
- Placeholder `@0` (MSSQL) → `?` hoặc named `:param` (TypeORM).
- `NEWID()` → `gen_random_uuid()` (Postgres) — abstract qua `@Generated('uuid')`.
- `GETDATE()` → `CURRENT_TIMESTAMP`.
- `ISNULL(a,b)` → `COALESCE(a,b)`.

Mục tiêu: **0 raw SQL string chứa keyword MSSQL-only** (verify bằng grep `TOP\s+\d|NEWID\(\)|GETDATE\(\)|ISNULL\(`).

### P4.3 Config DB driver-agnostic

`backend/src/shared/config/database.config.ts`:

```ts
const driver = process.env.DB_DRIVER ?? 'mssql';   // 'mssql' | 'postgres'
export default registerAs('database', () => ({
  type: driver,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: driver === 'mssql' ? { encrypt: false, trustServerCertificate: true } : undefined,
  ssl: driver === 'postgres' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  migrationsRun: process.env.DB_AUTO_MIGRATE === 'true',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
}));
```

### P4.4 Migration strategy portable

- Bỏ `database/migrations/*.sql` viết tay, dùng **TypeORM migrations TS** (`Migration1700000000000.up()` dùng QueryRunner API, vendor-neutral).
- Generate baseline migration từ schema MSSQL hiện tại: `bun typeorm migration:generate src/database/migrations/Baseline -d src/shared/database/datasource.ts`.
- Verify migration chạy được trên Postgres bằng container test.

### P4.6 Column rename trong entity (theo RENAME_MAP §D)

Per entity:
- Đổi property TS sang English (`maCauHoi` → `id`, `noiDung` → `content`, ...).
- Giữ `@Column({ name: 'MaCauHoi' })` để map về MSSQL column hiện tại.
- Update DTO + service + caller theo property mới.
- Khi sang Postgres ở P5: bỏ `name` override, dùng tự động snake_case (TypeORM `namingStrategy: SnakeNamingStrategy`).

Gate: grep `Ma[A-Z]|Ten[A-Z]|NgayTao|XoaTam` trong `src/` = 0 (chỉ còn trong `@Column({ name: ... })` decorator).

### P4.5 Gate cuối P4

- `DB_DRIVER=mssql bun run start:dev` → app chạy bình thường (golden test pass).
- `DB_DRIVER=postgres bun run start:dev` (với Postgres rỗng + migration) → app khởi động không crash, ít nhất CRUD `cau-hoi` và `de-thi` chạy được.

---

## P5 — Postgres dual-run (BẮT BUỘC, 3–5 ngày)

User đã chốt migrate Postgres. Schema mới dùng **snake_case English thẳng** theo [`RENAME_MAP.md`](./RENAME_MAP.md) §C, §D.

1. **Data port**: dùng `pgloader` hoặc Python script ETL `mssql → postgres`. Validate row count + checksum theo bảng.
2. **Shadow read**: thêm flag `READ_FROM_PG=true` cho 5% traffic, so sánh response với MSSQL → log diff.
3. **Shadow write**: dual-write 2 DB trong 1 tuần, monitor inconsistency.
4. **Cutover**: đổi `DB_DRIVER=postgres`, giữ MSSQL read-only 2 tuần làm rollback.

---

## P6 — Repo housekeeping (song song P1–P3)

### Repo root

```
xoá / archive:
- build-tips.md, fix_summary.md, test-image.txt
- docker-compose.simple.yml (giữ 1 docker-compose.yml + override)
- 5 file .md guide trùng (DEPLOYMENT_GUIDE, DOCKER_DEPLOYMENT_GUIDE, ECS_QUICK_START, USER_GUIDELINES, PROJECT_INVENTORY) → gộp vào docs/

giữ ở root:
- README.md, LICENSE, CLAUDE.md, .env.example
- Dockerfile, docker-compose.yml + override.{dev,prod}.yml
- pnpm-lock.yaml, package.json
```

### `scripts/` (74 file)

Phân loại trong `scripts/README.md`:
- `scripts/dev/`     — db-env-switcher, seed
- `scripts/ops/`     — deploy, migration runner
- `scripts/parsers/` — Python docx parsers (gọi từ `infrastructure/python-bridge`)
- `scripts/legacy/`  — chờ xoá

### `frontend/`

Ngoài scope plan này. Riêng smoke test `tests/smoke.spec.ts` cần extend cover 5 happy path sau backend refactor.

---

## 7. Quality Gates (tự động hoá trong CI)

```yaml
# .github/workflows/quality.yml
- bun run lint
- bun run build
- bun run test --coverage    (≥ baseline)
- bun run test:e2e
- npx madge --circular src/  (fail nếu có)
- grep -r "TOP\s\+[0-9]\|NEWID()\|GETDATE()\|ISNULL(" src/ && exit 1   # sau P4
- npx ts-prune                (báo dead exports)
```

Mỗi PR refactor phải pass tất cả + golden snapshot không đổi.

---

## 8. Effort & timeline tổng

| Phase | Effort | Dependencies | Có thể parallel? |
|---|---|---|---|
| P0 Verify | 0.5d | — | — |
| P1 Quick wins | 0.5d | P0 | ✅ |
| P2 Parser consolidation | 3–5d | P0 | ❌ critical path |
| P3 Module-first + rename | 6–8d | P2 | ✅ split theo BC |
| P4 Vendor-neutral DB + column rename | 4–5d | P3 | ✅ song song P3 cuối |
| P5 Postgres dual-run | 3–5d | P4 | ❌ |
| P6 Cutover + housekeeping | 2d | P5 | — |
| **Tổng đầy đủ (P0→P6)** | **20–30 ngày** | | |

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Parser regression (silent) | High | Critical | Golden snapshot bắt buộc trước P2 |
| Circular dep sau khi tách module | Medium | High | `madge --circular` trong CI; dùng `forwardRef` khi cần |
| MSSQL procedure ngoài repo | Medium | Critical | P0.1 query DB; nếu có → export vào `database/procedures/` trước khi đụng app |
| Big-bang merge conflict | High | Medium | PR theo BC, không gộp >500 LOC/PR |
| Production downtime khi đổi entity types (P4) | Low | High | Migration TS reversible; deploy blue-green |
| Postgres data drift (P5) | Medium | Critical | Shadow read 5%, diff log 1 tuần trước cutover |

---

## 10. Decisions đã chốt

1. ✅ **Postgres**: migrate thật, làm full P5 + P6.
2. ✅ **Rename English**: toàn bộ module + entity + table + column + route. Map tại [`RENAME_MAP.md`](./RENAME_MAP.md).
3. ✅ **`question-approval`** thay cho `cau-hoi-cho-duyet`.
4. ✅ **`audit-log`** thuộc Infrastructure, entity ở `shared/`.

### Decisions naming bổ sung (đã chốt 2026-04-27)

5. ✅ **Soft-delete**: giữ cặp `is_deleted` (bool, UI flag) + `deleted_at` (timestamptz, audit). Áp dụng cho mọi entity có `XoaTam*` / `DaXoa`.
6. ✅ **`MaSoCauHoi`** → `question_code` (đổi từ `id_questions` để tránh confuse với PK/FK).
7. ✅ **`DeThi.NguoiTao`** → `created_by uuid NOT NULL`. ETL bắt buộc lookup username→uuid, fail loudly nếu không resolve được. Verify trước ETL bằng query trong §I.3.

---

## 11. Next action ngay hôm nay

1. Chạy P0.1 query trên DB production → confirm có/không procedure.
2. Tạo `docs/audit/` folder, lưu baseline madge + API contract.
3. Viết golden snapshot cho parser (`backend/test/fixtures/golden/`).
4. Merge P1 quick wins (1 PR, 9 commit nhỏ).
5. Sau đó mới bắt đầu P2.

**Không bắt đầu P2 nếu chưa có golden snapshot.**

---

**Author**: Detailed plan, supersedes `backend/REFACTOR_PLAN.md` (v1 vẫn giữ làm reference).
**Date**: 2026-04-27
