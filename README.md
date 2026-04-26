# Graduation

Question bank and exam management monorepo for an educational workflow. The repo currently contains one React frontend, one NestJS backend, SQL/database assets, deployment configs, monitoring configs, templates, and document-import support files.

## What this repo is

Current verified state:
- Monorepo-style repository
- Frontend: React 18 + Vite + TypeScript
- Backend: NestJS 11 + TypeORM + SQL Server support
- Architecture: modular monolith, not microservices
- Supporting infra in repo: Redis, Kafka, Qdrant, Prometheus, Grafana, Nginx, Docker Compose

Main product areas:
- Question bank: academic catalog, questions, answers, import, approval, media
- Exam management: exam generation, editing, packaging, export

## Repository layout

```text
Graduation/
├── backend/              NestJS API and business modules
├── frontend/             React SPA
├── database/             Database assets
├── deployment/           Deployment support files
├── monitoring/           Prometheus and Grafana config
├── docs/                 Evergreen docs and internal planning docs
├── scripts/              Utility and parser support scripts
├── template/             Export templates
├── templates/            Additional templates/reference assets
└── sample_word_files/    Sample import files
```

## Start here

Read these docs first:
- `docs/project-overview-pdr.md`
- `docs/codebase-summary.md`
- `docs/system-architecture.md`
- `docs/deployment-guide.md`

Existing internal reference docs still matter:
- `docs/SYSTEM_OVERVIEW.md`
- `docs/REFACTOR_PLAN_DETAILED.md`
- `docs/RENAME_MAP.md`

## Requirements

Core requirements inferred from repo scripts and config:
- Bun
- SQL Server access for the current backend database baseline
- Redis for queue-backed features

Optional, depending on workflow:
- Docker and Docker Compose
- Python for parser/export support
- Object storage credentials for non-local file storage

## Local development

### Backend
```bash
cd backend
bun install
bun run dev
```

Backend facts verified from code:
- global API prefix: `/api`
- Swagger UI: `/api`
- health endpoints: `/health`, `/ready`, `/live`
- metrics endpoint: `/metrics`

### Frontend
```bash
cd frontend
bun install
bun run dev
```

## Important environment note

Current code reality to verify in your environment:
- backend `.env.example` defaults to port `3001`
- `frontend/src/config.ts` currently sets `API_BASE_URL` to `http://localhost:3000/api`

Do not assume local frontend-backend wiring is correct without checking the actual environment or proxy setup.

## Useful scripts

### Backend
```bash
bun run build
bun run lint
bun run test
bun run test:cov
bun run test:e2e
```

### Frontend
```bash
bun run build
bun run lint
bun run test:e2e
```

## Docker Compose options

Available compose files:
- `docker-compose.yml` — broader local stack with frontend, backend, Redis, Kafka, Qdrant, Prometheus, Grafana
- `docker-compose.production.yml` — backend, Redis, and Nginx
- `docker-compose.monitoring.yml` — monitoring-focused stack
- `docker-compose.build.yml`
- `docker-compose.simple.yml`

Typical commands:
```bash
docker compose up -d
docker compose -f docker-compose.production.yml up -d
```

## Backend module overview

Verified from `backend/src/app.module.ts`:
- auth and users
- faculties, subjects, sections, CLOs
- questions, answers, approvals, imports
- exams, exam details, exam packages, exports
- files, queue, integration, monitoring
- multiple parser/import-related modules

This breadth is why the repo should be described as a modular monolith.

## Operational endpoints

Verified root backend endpoints:
- `/health`
- `/ready`
- `/live`
- `/metrics`
- `/db-config`

Monitoring routes also exist under:
- `/api/monitoring`
- `/api/monitoring/dashboard`

## Deployment note

Verified Nginx config lives at:
- `deployment/nginx/nginx.conf`

Before production deployment, verify that compose mount paths match the real location of Nginx config and certificates.

## Documentation map

Standardized docs in `docs/`:
- `project-overview-pdr.md`
- `codebase-summary.md`
- `code-standards.md`
- `system-architecture.md`
- `project-roadmap.md`
- `deployment-guide.md`

## Current known issues to keep in mind

- Frontend API base URL appears inconsistent with backend default port.
- Route naming is mixed, with many core backend resources still using Vietnamese names.
- Parser/import capabilities span multiple modules and legacy controller paths.
- Compose files represent multiple environments and are not yet fully unified.

## License

See `LICENSE`.
