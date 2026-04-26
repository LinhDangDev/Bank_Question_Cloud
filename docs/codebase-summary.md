# Codebase Summary

Last updated: 2026-04-27
Status: active
Source baseline: verified from code entrypoints plus `repomix-output.xml`

## Repository at a glance

Graduation is a monorepo containing a React frontend, a NestJS backend, SQL assets, deployment files, monitoring config, templates, and parser/export support assets.

## Top-level structure

| Path | Role |
|---|---|
| `backend/` | NestJS API, business modules, TypeORM entities, auth, queue, file handling, monitoring |
| `frontend/` | React + Vite application with protected routes and feature pages |
| `database/` | SQL assets and database-related files |
| `docs/` | New evergreen docs plus existing internal planning/reference docs |
| `deployment/` | Deployment support files; currently contains Nginx config path requested by task |
| `monitoring/` | Prometheus and Grafana config |
| `scripts/` | Utility and parser support scripts |
| `template/`, `templates/` | Export/import template assets |
| `sample_word_files/` | Example source files for document-import workflows |
| `docker-compose*.yml` | Development, monitoring, production, and simplified compose variants |

## Backend summary

### Entry points
- App module: `D:\Code\Graduation\backend\src\app.module.ts`
- Bootstrap: `D:\Code\Graduation\backend\src\main.ts`
- Package manifest: `D:\Code\Graduation\backend\package.json`

### Runtime shape

The backend is a modular monolith built on NestJS. `AppModule` wires configuration, TypeORM, Bull/Redis, and many feature modules into one deployable API service.

### Verified modules imported by `AppModule`

- `MonHocModule`
- `CauHoiModule`
- `PhanModule`
- `CauTraLoiModule`
- `KhoaModule`
- `CLOModule`
- `DeThiModule`
- `ChiTietDeThiModule`
- `FilesModule`
- `YeuCauRutTrichModule`
- `QueueModule`
- `AuthModule`
- `QuestionsImportModule`
- `CauHoiChoDuyetModule`
- `UsersModule`
- `NotificationModule`
- `AuditLogModule`
- `IntegrationModule`
- `ExamExportModule`
- `WordMultimediaModule`
- `MultimediaExamModule`
- `ExamPackageModule`
- `EnhancedDocxParserModule`
- `QuestionParserModule`
- `PythonDocxParserModule`
- `PythonEnhancedDocxParserModule`
- `ExamWordExportModule`
- `MonitoringModule`

### Backend behavior confirmed from bootstrap

- Loads `.env` from several candidate locations.
- Configures large JSON and URL-encoded body limits.
- Enables permissive CORS.
- Serves static files from `public/` and `uploads/`.
- Sets global API prefix to `/api`.
- Publishes Swagger UI at `/api`.
- Writes `swagger.json` on startup.
- Exposes root endpoints including `/health`, `/ready`, `/live`, `/metrics`, and DB config helpers.

### API route families confirmed from controllers

| Route prefix | Notes |
|---|---|
| `auth` | Authentication |
| `users` | User management |
| `khoa` | Faculty-like resource, current Vietnamese naming |
| `mon-hoc` | Subject-like resource |
| `phan` | Section/chapter-like resource |
| `clo` | CLO resource |
| `cau-hoi` | Questions |
| `cau-tra-loi` | Answers |
| `cau-hoi-cho-duyet` | Question approvals |
| `de-thi` | Exams |
| `chi-tiet-de-thi` | Exam details |
| `yeu-cau-rut-trich` | Extraction requests |
| `questions-import` | Question import workflow |
| `word-import` | Word/multimedia import support |
| `files`, `files-url`, `files-spaces` | File handling |
| `exam-export`, `exam-word-export`, `exam-packages` | Export and packaging |
| `integration` | Integration endpoints |
| `multimedia-exam` | Multimedia exam workflow |
| `monitoring`, `monitoring/dashboard` | Monitoring and dashboard endpoints |

### Backend dependencies of note

- NestJS 11
- TypeORM 0.3.x
- MSSQL and `msnodesqlv8`
- Bull + Redis
- Swagger
- AWS SDK / S3-compatible storage clients
- Puppeteer, Sharp, Docx-related libraries
- Qdrant client present as dependency

## Frontend summary

### Entry points
- Package manifest: `D:\Code\Graduation\frontend\package.json`
- Main app routes: `D:\Code\Graduation\frontend\src\App.tsx`
- Frontend config: `D:\Code\Graduation\frontend\src\config.ts`

### Runtime shape

The frontend is a React 18 + Vite SPA with auth context, theme context, route guards, and feature pages for questions, subjects, exams, monitoring, users, settings, support, and auth.

### Frontend route areas confirmed from `App.tsx`

- Auth: `/login`, `/change-password`
- Home/dashboard: `/`, `/dashboard`, `/search`
- Academic catalog: `/faculty`, `/subjects/:facultyId`, `/chapters/:subjectId`
- Questions: `/questions`, create/edit/group/upload/approval/chapter views
- Exam and tool flows: `/extract`, `/pdf`, `/exams`, exam detail/edit flows
- User management: `/users`, add/edit
- Monitoring: `/monitoring`
- Support/settings: `/help`, `/feedback`, `/settings`

### Frontend structure confirmed by directory scan

- `src/pages/`
- `src/components/`
- `src/services/`
- `src/hooks/`
- `src/context/`

### Frontend implementation notes

- Uses both Axios and raw `fetch`.
- Uses `AuthProvider` and `ThemeProvider`.
- Guards protected routes via `RequireAuth`.
- Contains global error handling in `App.tsx`.
- Includes Playwright scripts for e2e tests.

### Frontend API configuration note

Local development should call backend directly on `http://localhost:3001`.

If `frontend/src/config.ts` points elsewhere, treat that as config drift rather than intended architecture.

## Infrastructure summary

### Compose files present
- `docker-compose.yml`
- `docker-compose.production.yml`
- `docker-compose.monitoring.yml`
- `docker-compose.build.yml`
- `docker-compose.simple.yml`

### Development compose highlights
`docker-compose.yml` includes:
- frontend
- backend
- redis
- zookeeper
- kafka
- qdrant
- prometheus
- grafana

### Production compose highlights
`docker-compose.production.yml` includes:
- backend
- redis
- nginx

Health check in production compose points to `http://localhost:3001/api/health` inside the backend container.

### Nginx
Verified config at `D:\Code\Graduation\deployment\nginx\nginx.conf` includes:
- HTTP to HTTPS redirect
- `/api/` proxying to backend
- login-specific rate limiting
- larger upload settings
- `/health` proxy to backend `/api/health`

## Monitoring summary

Verified monitoring assets include:
- `monitoring/prometheus.yml`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/grafana/datasources/datasource.yml`
- `monitoring/grafana/dashboards/dashboard.yml`
- backend monitoring module under `backend/src/modules/monitoring/`

## Existing internal docs worth retaining

| File | How to use it |
|---|---|
| `docs/SYSTEM_OVERVIEW.md` | Domain and mental-model reference; useful, but partly planning-oriented |
| `docs/REFACTOR_PLAN_DETAILED.md` | Refactor roadmap and migration plan; not current-state spec |
| `docs/RENAME_MAP.md` | Planned Vietnamese-to-English rename map |
| `docs/README.md` | Internal reading order for older docs |

## Repomix note

A packed repository snapshot was generated at:
- `D:\Code\Graduation\repomix-output.xml`

Use it as a read-only analysis artifact. Do not edit it directly.
