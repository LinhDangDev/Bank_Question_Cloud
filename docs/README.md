# Documentation Index

## Evergreen docs

Đọc bộ này trước nếu bạn cần hiểu repo theo trạng thái hiện tại:

| File | Purpose |
|---|---|
| [`project-overview-pdr.md`](./project-overview-pdr.md) | Product scope, requirements baseline, and current repo assumptions |
| [`codebase-summary.md`](./codebase-summary.md) | Repository layout, entrypoints, main modules, and operational notes |
| [`code-standards.md`](./code-standards.md) | Practical code and documentation standards inferred from the repo |
| [`system-architecture.md`](./system-architecture.md) | Current architecture, runtime components, and boundaries |
| [`project-roadmap.md`](./project-roadmap.md) | High-level roadmap and priorities |
| [`deployment-guide.md`](./deployment-guide.md) | Local, compose-based, and production deployment guidance |

## Internal planning docs

Giữ lại để phục vụ refactor và migrate:

| File | Purpose | When to read |
|---|---|---|
| [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md) | Mental model hệ thống, domain, data flow, glossary VI↔EN | Onboarding, trước refactor |
| [`REFACTOR_PLAN_DETAILED.md`](./REFACTOR_PLAN_DETAILED.md) | Kế hoạch refactor chi tiết P0→P6 | Trước khi code refactor |
| [`RENAME_MAP.md`](./RENAME_MAP.md) | Map rename Vietnamese → English | Khi thực thi rename/migrate |

## Reading order

### Current implementation first
1. `project-overview-pdr.md`
2. `codebase-summary.md`
3. `system-architecture.md`
4. `deployment-guide.md`

### Refactor and migration context
1. `SYSTEM_OVERVIEW.md`
2. `RENAME_MAP.md`
3. `REFACTOR_PLAN_DETAILED.md`

## Confirmed decisions

- Frontend local development calls backend directly on `http://localhost:3001`.
- Production compose should use the Nginx config under `deployment/nginx/`.
- Existing internal planning docs remain available; evergreen docs are the primary source for current-state documentation.

## Update protocol

- Update evergreen docs first when current repo behavior changes.
- Update internal planning docs when refactor or migration decisions change.
- Use `git mv` when renaming docs to preserve history.

---

**Last updated**: 2026-04-27
