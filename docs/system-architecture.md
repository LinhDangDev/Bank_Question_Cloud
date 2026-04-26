# System Architecture

Last updated: 2026-04-27
Status: active

## Architecture summary

The current system is a modular monolith:
- One React frontend application in `frontend/`
- One NestJS backend application in `backend/`
- One primary SQL Server-backed persistence model
- Several supporting infrastructure services available through Docker and operational config

It is not currently implemented as microservices.

## High-level view

```text
Browser
  -> React frontend (Vite)
  -> HTTP API under /api
  -> NestJS backend
      -> TypeORM -> SQL Server
      -> Bull -> Redis
      -> file storage -> local disk or S3-compatible storage
      -> parser/export helpers -> Python/docx toolchain where applicable
      -> monitoring endpoints -> Prometheus/Grafana ecosystem
```

## Frontend architecture

### Main characteristics
- Single-page application built with React 18 and Vite.
- Route-based navigation in `frontend/src/App.tsx`.
- Auth-protected route tree via context and route guards.
- UI built from feature pages, reusable components, hooks, and services.

### Frontend logical areas

| Area | Notes |
|---|---|
| Auth | Login and first-time password change |
| Academic catalog | Faculty, subject, and chapter/section navigation |
| Question bank | Question list, create/edit, group question, upload, approval |
| Exam tools | Exam list/detail, export-related flows, extraction workflow |
| Admin/support | Users, monitoring, settings, help, feedback |

### Frontend concerns
- API integration is split between Axios service wrappers and direct `fetch` calls.
- Route protection is implemented client-side but depends on backend auth correctness.
- Current config hardcodes `API_BASE_URL` and should be verified per environment.

## Backend architecture

### Main characteristics
- NestJS app bootstrapped from `backend/src/main.ts`.
- Central composition via `backend/src/app.module.ts`.
- TypeORM for data access.
- Bull/Redis for async or queued work.
- Swagger generated from the running app.

### Backend layers in practice

| Layer | Current implementation style |
|---|---|
| Transport | NestJS controllers under module folders plus some legacy parser controllers |
| Application logic | NestJS services per module |
| Persistence | TypeORM entities and repositories/patterns embedded in modules/services |
| Infra integration | Files, monitoring, queue, storage, parser/export helpers |

### Major backend domains

| Domain | Modules |
|---|---|
| Auth and users | `auth`, `users`, `audit-log`, `notification` |
| Academic catalog | `khoa`, `mon-hoc`, `phan`, `clo` |
| Question bank | `cau-hoi`, `cau-tra-loi`, `cau-hoi-cho-duyet`, `questions-import` |
| Exams | `de-thi`, `chi-tiet-de-thi`, `exam-package`, `exam-export`, `exam-word-export`, `multimedia-exam`, `yeu-cau-rut-trich` |
| Parsing/import | `word-import`, `enhanced-docx-parser`, `python-docx-parser`, `python-enhanced-docx-parser`, `question-parser` |
| Platform/integration | `files`, `queue`, `integration`, `monitoring` |

## Data and storage architecture

### Primary database
- Current code targets SQL Server.
- Connection details come from environment/config.
- TypeORM is initialized globally through `AppModule` configuration.

### File storage
The repo supports two broad file-storage modes:
- Local filesystem paths such as `uploads/` and `public/`
- S3-compatible object storage configuration, including DigitalOcean Spaces-style settings

### Queueing
- Bull is configured globally.
- Redis host/port/password are environment-driven.
- Queue infrastructure supports heavy or asynchronous workflows such as imports and generation tasks.

## Operational architecture

### Health and observability
Verified root backend endpoints:
- `/health`
- `/ready`
- `/live`
- `/metrics`
- `/db-config`

Additional monitoring endpoints exist under:
- `/api/monitoring`
- `/api/monitoring/dashboard`

### Monitoring stack in repo
- Prometheus config under `monitoring/`
- Grafana datasource/dashboard config under `monitoring/grafana/`
- Backend monitoring module for metrics and dashboard APIs

### Edge proxy
Nginx config at `deployment/nginx/nginx.conf` provides:
- TLS termination pattern
- API proxying
- rate limiting for general API and auth paths
- upload body-size tuning
- `/health` proxying to backend `/api/health`

## Deployment architecture

### Local development mode
Usually run as two app processes:
- frontend dev server
- backend dev server

Optional supporting services via Docker Compose:
- redis
- kafka and zookeeper
- qdrant
- prometheus
- grafana

### Production-oriented compose mode
Verified production compose focuses on:
- backend
- redis
- nginx

This means the repo currently documents several infra options, but not every option is necessarily required for every deployment profile.

## Current architecture issues and constraints

### Verified constraints
- Backend default example port is 3001.
- Frontend local development is expected to call backend directly on `http://localhost:3001`.
- Core backend routes still use Vietnamese naming for many resources.
- Legacy parser surface area is broader than a single consolidated import pipeline.
- Production compose should use the Nginx config under `deployment/nginx/`.

### Implications
- Frontend config should align with direct backend access on port `3001`.
- Architecture docs must distinguish current route names from planned English renames.
- Refactor plans should be treated as directional, not current-state descriptions.

## Planned direction to keep in mind

Existing internal docs indicate a likely direction toward:
- English naming across modules, entities, routes, and database objects
- Cleaner module ownership and less global sprawl
- parser consolidation
- more vendor-neutral database abstractions
- eventual Postgres migration

Those plans are documented in:
- `D:\Code\Graduation\docs\REFACTOR_PLAN_DETAILED.md`
- `D:\Code\Graduation\docs\RENAME_MAP.md`

They are not the current architecture baseline.
