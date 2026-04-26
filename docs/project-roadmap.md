# Project Roadmap

Last updated: 2026-04-27
Status: active

## How to read this roadmap

This roadmap is a practical, current-state planning view. It does not replace the detailed internal refactor plan. Instead:
- This file tracks the repo at a high level.
- `REFACTOR_PLAN_DETAILED.md` remains the detailed technical refactor reference.
- `RENAME_MAP.md` remains the planned naming migration reference.

## Current baseline

The repository already contains a large feature surface:
- Question bank management
- Question import and parsing workflows
- Approval flows
- Exam generation and export flows
- Monitoring endpoints and monitoring config
- Compose-based local and production deployment assets

The main need now is stabilization, documentation clarity, and safer incremental cleanup.

## Roadmap phases

### Phase 1 — Documentation baseline
Status: complete

Goals:
- Standardize project docs in `docs/`
- Replace stale repo-level descriptions with verified current-state docs
- Keep internal planning docs available as references

Outputs:
- `project-overview-pdr.md`
- `codebase-summary.md`
- `code-standards.md`
- `system-architecture.md`
- `project-roadmap.md`
- `deployment-guide.md`
- cleaned root `README.md`

### Phase 2 — Environment and operational alignment
Status: proposed

Goals:
- Normalize frontend/backend local routing expectations in docs and config
- Reduce confusion around ports, proxying, and API base URL usage
- Document which Compose files are canonical for which purpose

Suggested work:
- Align frontend config with direct backend access on `3001` in dev
- Standardize environment examples across frontend, backend, and compose files
- Align production compose mounts with `deployment/nginx/`

### Phase 3 — Parser and import consolidation
Status: proposed

Why it matters:
- The repo contains multiple parser-related modules and legacy controller paths.
- Import behavior is important and likely brittle.

Suggested work:
- Inventory parser entrypoints and owning flows
- Define one primary import path and document fallbacks
- Add or improve regression coverage around sample Word files

Reference:
- `REFACTOR_PLAN_DETAILED.md`

### Phase 4 — Backend structure cleanup
Status: proposed

Goals:
- Reduce structural drift between modules, shared logic, and legacy controller/service paths
- Improve module ownership and maintainability without changing product behavior first

Suggested work:
- Move or consolidate legacy parser controllers and services
- Reduce cross-cutting sprawl where ownership is unclear
- Continue documenting route families and module boundaries as they evolve

### Phase 5 — Naming and database migration track
Status: planned, not started as current-state implementation

Goals:
- English naming migration
- More portable database abstractions
- Eventual Postgres migration if project priorities continue in that direction

Important:
- This phase is still planning/reference material today.
- Current implementation still uses Vietnamese route/domain naming in many places and SQL Server as the active baseline.

References:
- `REFACTOR_PLAN_DETAILED.md`
- `RENAME_MAP.md`

## Current priorities

1. Keep onboarding and operations clear.
2. Avoid documentation drift.
3. Reduce environment ambiguity.
4. Preserve existing feature behavior before structural change.
5. Make refactor work incremental and testable.

## Risks to manage

| Risk | Impact | Mitigation |
|---|---|---|
| Docs describe future state as current state | High | Keep roadmap and architecture docs explicit about status |
| Port/proxy mismatch confuses local setup | High | Document verified defaults and call out mismatches |
| Parser/import refactor breaks core workflows | High | Inventory and regression-test before consolidation |
| Infra files imply mandatory services that may be optional | Medium | Document required vs optional services per deployment mode |

## Milestones

| Milestone | Status |
|---|---|
| Evergreen repo docs baseline created | Complete |
| Root README aligned with codebase reality | Complete |
| Dev/prod environment assumptions clarified | Pending |
| Parser surface area documented | Pending |
| Structural refactor sequence agreed | Pending |
| Naming/database migration execution started | Pending |

## Related documents

- `D:\Code\Graduation\docs\project-overview-pdr.md`
- `D:\Code\Graduation\docs\system-architecture.md`
- `D:\Code\Graduation\docs\REFACTOR_PLAN_DETAILED.md`
- `D:\Code\Graduation\docs\RENAME_MAP.md`
