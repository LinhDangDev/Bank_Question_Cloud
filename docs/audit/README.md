# Audit Artifacts (P0 Verify)

> Snapshots **trước khi refactor** để verify không regression.
> Đầu ra của P0 từ `@docs/REFACTOR_PLAN_DETAILED.md`.

## Files

| File | Nguồn | Cập nhật khi |
|---|---|---|
| `p0-db-objects.sql` | Query template (committed) | Khi schema thay đổi |
| `p0-db-objects-report.md` | Output từ SQL chạy production | Mỗi lần verify P0 |
| `madge-baseline.json` | `bunx madge --json src/` | Trước P3 + sau mỗi phase |
| `madge-circular-baseline.txt` | `bunx madge --circular src/` | — |
| `api-baseline.json` | Swagger spec từ `bun run swagger` | Trước P3 + sau P3 (so sánh) |
| `golden/` | Output parser từ `sample_word_files/` | Trước P2, KHÓA luôn |

## P0 Checklist (2026-04-27)

- [x] Scan `database/archive/databasetable.sql` → `p0-db-objects-report.md` + `p0-procedures-list.txt`
- [x] `madge-baseline.json` (30 KB, 175 TS files)
- [x] `madge-circular-baseline.txt` (**11 circular deps** — toàn bộ ở `entities/`, do TypeORM cross-refs)
- [ ] `api-baseline.json` ⏭️ **Defer** — cần DB chạy được mới start Swagger. Sẽ làm sau khi import dump vào local SQL Server hoặc sang Postgres.
- [ ] Golden snapshots parser ⏭️ **Move sang đầu P2** (gọn flow hơn).

## Gate cuối P0 — Verdict

| Check | Result |
|---|---|
| Stored procedures ngoài repo | ⚠️ **161 procs** trong dump nhưng **0 procs được app gọi** (verified grep EXEC) |
| Triggers/Views/Functions | ✅ Không có (0/0/0) |
| 4 business logic procs | ⚠️ **Cần user xác nhận** (xem `p0-db-objects-report.md` §1.1) |
| SQL Agent jobs | ⚠️ Không thể verify từ dump — user confirm |
| Circular deps baseline | ✅ 11 cycle ghi nhận, target P3: ≤ 5, P4: 0 |

→ **OK để tiếp tục P1** với điều kiện user trả lời 4 câu hỏi ở §2 của report.

---

**Last updated**: 2026-04-27
