# Project Overview and Product Development Requirements

Last updated: 2026-04-27
Status: active

## Purpose

Graduation is a monorepo for an educational question bank and exam management system. The current repository contains one React frontend and one NestJS backend, plus database assets, deployment configs, monitoring configs, templates, and parser/export support files.

The system supports two closely related product areas:
- Question bank operations: manage subjects, sections, questions, answers, approvals, and media.
- Exam operations: generate exams, edit exam composition, export exam documents, and package related assets.

## Current repo state

- Backend: NestJS 11, TypeORM, JWT auth, Bull queue, MSSQL driver, Swagger at `/api`.
- Frontend: React 18 + Vite + TypeScript, auth-protected routes, mixed API usage via Axios and `fetch`.
- Database target in code today: SQL Server.
- Supporting infra present in repo: Redis, Kafka, Qdrant, Prometheus, Grafana, Nginx, Docker Compose.
- Architecture style today: modular monolith, not microservices.

## Primary users

| User | Main capabilities |
|---|---|
| Admin | Manage users, faculties, subjects, sections, questions, approvals, and system operations |
| Teacher | Create/import questions, manage own content, submit content for approval |
| Academic reviewer or lead | Approve questions, generate exams, export outputs |

## Verified product capabilities

### Question bank
- CRUD-style APIs for faculties, subjects, sections, questions, answers, CLOs, users, and approvals exist in backend modules.
- Frontend routes exist for question listing, create/edit, grouped questions, upload/import, and approval review.
- Word import and parser-related modules exist, including legacy parser controllers and `questions-import` endpoints.
- File and media handling modules exist for uploads, URL generation, and multimedia question/exam workflows.

### Exam management
- Backend modules exist for `de-thi`, `chi-tiet-de-thi`, `exam-package`, `exam-export`, `exam-word-export`, and `multimedia-exam`.
- Frontend routes exist for exams list, exam detail, exam editing, PDF flow, and extract flow.

### Operations and observability
- Root health-style endpoints exist: `/health`, `/ready`, `/live`, `/metrics`, `/db-config`.
- Monitoring module exists with dashboard and monitoring controllers.
- Prometheus and Grafana configuration directories exist in repo.

## Problem statement

The repository has strong feature breadth, but its documentation was fragmented and partly forward-looking. The immediate need is a stable documentation baseline that matches the code as it exists now, while still preserving planned refactor direction as secondary context.

## Product goals

1. Keep question-bank workflows operational and understandable.
2. Keep exam generation and export workflows operational and supportable.
3. Reduce onboarding time for new developers.
4. Make deployment and environment setup reproducible.
5. Document refactor direction without misrepresenting current implementation.

## Non-goals for this doc set

- No claim that the system is already microservices-based.
- No claim that the Postgres migration is complete.
- No claim that all planned infra components are wired into production runtime.
- No attempt to replace detailed internal planning docs such as `REFACTOR_PLAN_DETAILED.md`.

## Functional requirements

### FR1. Authentication and access control
- The system must support authenticated access to protected frontend routes.
- The backend must expose auth endpoints under `/api/auth`.
- The frontend must redirect unauthenticated users to the login route.
- The frontend must support forced first-time password change flow.

### FR2. Academic catalog management
- The system must support faculties, subjects, sections, and CLO management.
- The backend must expose APIs for these resources.
- The frontend must support navigation across faculty, subject, and chapter/section views.

### FR3. Question lifecycle
- The system must support question creation, editing, grouping, upload/import, approval, soft-delete/restore patterns, and answer management.
- The system must support media-linked questions.

### FR4. Import and parsing
- The system must support document import flows for question ingestion.
- The repo must retain parser-related scripts and modules needed for current import workflows.
- Golden-output or parser-consolidation work remains roadmap work, not current-state behavior.

### FR5. Exam lifecycle
- The system must support exam generation, exam detail retrieval, exam question editing, packaging, and export workflows.
- The system must support word-export-related flows present in backend and frontend.

### FR6. Files and media
- The system must support local uploads and optional object-storage-backed file serving.
- The repo must preserve current support for local storage and DigitalOcean Spaces-style configuration.

### FR7. Monitoring and diagnostics
- The system must expose health and metrics endpoints.
- The repo must include monitoring configuration for Prometheus and Grafana.

## Non-functional requirements

| Area | Requirement |
|---|---|
| Availability | Health endpoints should expose process status and readiness basics |
| Security | JWT auth, route protection, environment-based secrets, and upload constraints should be preserved |
| Maintainability | Docs must separate current state from planned refactor direction |
| Operability | Local development and compose-based deployment paths must stay documented |
| Performance | Queue-backed and async-friendly flows should remain available for heavy operations |
| Observability | Metrics and monitoring endpoints/config should remain documented and discoverable |

## Technical constraints

- Backend currently depends on SQL Server-compatible configuration and drivers.
- Backend queue configuration depends on Redis.
- Some document-processing behavior depends on Python-based support scripts or export helpers in repo.
- Frontend currently contains mixed endpoint naming conventions and a hard-coded API base URL in `frontend/src/config.ts`.
- Existing internal docs describe an English-renaming and Postgres migration plan, but those are not the current implementation baseline.

## Acceptance criteria for the initial documentation baseline

1. Root `README.md` describes the repo as a modular monolith with one frontend and one backend.
2. `docs/codebase-summary.md` summarizes the real repository layout and main entrypoints.
3. `docs/code-standards.md` describes practical standards inferred from current code and repo conventions.
4. `docs/system-architecture.md` distinguishes current architecture from planned refactor direction.
5. `docs/project-roadmap.md` captures current priorities and references the internal refactor plan.
6. `docs/deployment-guide.md` describes local and compose-based deployment paths using verified files.
7. Existing internal docs remain available and are referenced rather than deleted.

## Risks and open issues

- Frontend local development is expected to call backend directly on `http://localhost:3001`.
- Compose files reflect multiple deployment modes and are not fully unified.
- Production compose should use the Nginx config under `deployment/nginx/`.
- Monitoring, Kafka, and Qdrant are present in repo, but their runtime usage depth varies and should be described conservatively.

## Related internal docs

- `D:\Code\Graduation\docs\SYSTEM_OVERVIEW.md`
- `D:\Code\Graduation\docs\REFACTOR_PLAN_DETAILED.md`
- `D:\Code\Graduation\docs\RENAME_MAP.md`
