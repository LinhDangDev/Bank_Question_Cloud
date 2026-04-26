# 📚 Internal Documentation — Graduation Project

> Tài liệu nội bộ cho team. **Đọc trước khi đụng vào code, đặc biệt trước khi migrate.**

## Map of contents

| File | Mục đích | Đọc khi nào |
|---|---|---|
| [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md) | Hiểu hệ thống đang làm gì, domain, data flow, glossary VI↔EN | **Bắt đầu từ đây** — onboarding, trước mọi refactor |
| [`REFACTOR_PLAN_DETAILED.md`](./REFACTOR_PLAN_DETAILED.md) | Kế hoạch refactor 7 phase (P0→P6), từ NestJS module-first đến Postgres cutover | Trước khi code refactor |
| [`RENAME_MAP.md`](./RENAME_MAP.md) | Map rename Vietnamese → English: module, entity, table, column, route, type | Khi thực thi P3.0 và P4.6 |

## Reading order

### Onboarding 1 dev mới (~30 phút)
1. `SYSTEM_OVERVIEW.md` §1–§4 (hiểu domain + module map)
2. `RENAME_MAP.md` §A, §B (biết tên class/folder hiện hành)
3. `REFACTOR_PLAN_DETAILED.md` §0 + §10 (biết hướng đi + decision đã chốt)

### Trước khi migrate Postgres
1. `SYSTEM_OVERVIEW.md` §5 (data flow + critical paths)
2. `RENAME_MAP.md` toàn bộ §D (column-by-column)
3. `REFACTOR_PLAN_DETAILED.md` P0 → P5

### Trước khi PR refactor module
1. `RENAME_MAP.md` §A, §B (rename target)
2. `REFACTOR_PLAN_DETAILED.md` P3.0 + P3 target tree

## Conventions trong docs

- Tiếng Việt cho discussion + decision rationale.
- Code/identifier giữ nguyên gốc (TS, SQL, file path).
- Mọi quyết định đã chốt phải có dấu ✅ và ngày chốt.
- Mọi câu hỏi mở phải có dấu ⚠️ + người cần trả lời.

## Update protocol

- Khi thay đổi quyết định → update file tương ứng + bump date ở footer + ghi vào "decision log" của file đó.
- Khi rename file: `git mv` để giữ history.
- Không xoá quyết định cũ — strike-through (`~~old~~ → new`) để giữ rationale.

---

**Last updated**: 2026-04-27
