# Code Standards

Last updated: 2026-04-27
Status: active

## Intent

This document records practical standards that match the current repository. It is not a rewrite target. Where the codebase is inconsistent today, this document states the preferred direction for future edits without claiming the repo is already fully aligned.

## Core principles

- Prefer small, targeted changes over broad rewrites.
- Keep current runtime behavior stable before pursuing naming or structural cleanup.
- Document current Vietnamese domain naming where it still exists in code.
- Add new code inside the existing backend module or frontend feature area instead of creating parallel patterns.

## Repository conventions

### Monorepo layout
- Keep backend code in `backend/`.
- Keep frontend code in `frontend/`.
- Keep evergreen project docs in `docs/`.
- Keep deployment and monitoring config outside app code unless runtime ownership clearly belongs inside an app.

### Documentation
- Treat docs in `docs/` as the current source of truth for repo-level guidance.
- Keep internal planning docs such as `REFACTOR_PLAN_DETAILED.md` and `RENAME_MAP.md` as planning/reference material.
- Update docs when route names, ports, env keys, or operational workflows change.

## Backend standards

### Architecture style
- Treat the backend as a modular monolith.
- Add new business logic to an existing NestJS module when possible.
- Avoid introducing microservice language or patterns unless the deployment model actually changes.

### Module organization
Current repo uses one folder per module under `backend/src/modules/` plus some legacy parser controllers/services outside module folders.

Preferred direction for new backend work:
- Keep controller, service, DTOs, and module definition close to the owning feature.
- Avoid adding new global controller/service files under broad shared folders unless they are truly cross-cutting.

### Naming
- Keep current identifiers unchanged when touching existing APIs unless the task explicitly includes migration or compatibility planning.
- For new file names, use kebab-case.
- For TypeScript types/classes, use PascalCase.
- For functions, variables, DTO properties, and service methods, use camelCase.
- Preserve current API route naming conventions when extending an existing route family.

### DTOs and validation
- Use Nest validation and transformation patterns already enabled by global `ValidationPipe`.
- Assume whitelist and non-whitelisted-field rejection are active.
- Add DTO validation for new inputs instead of validating ad hoc in controllers.

### Error handling
- Prefer framework exceptions and structured responses over raw thrown strings.
- Preserve meaningful validation errors because the global validation pipe formats field-level messages.
- Log operationally relevant failures; do not log secrets.

### Configuration
- Read config from environment variables or config helpers.
- Do not hardcode secrets, credentials, or production URLs.
- Keep `.env.example` updated when introducing required configuration.

### Persistence
- Use TypeORM patterns already present in the repo.
- Treat SQL Server compatibility as current-state requirement.
- Do not document or implement Postgres-specific behavior as current state unless the code has actually changed.

### File and media handling
- Reuse existing file modules and storage config patterns.
- Document storage-provider-specific behavior carefully because the repo supports local storage and object storage configuration.

### Monitoring and health
- Preserve `/health`, `/ready`, `/live`, and `/metrics` behavior when making platform changes.
- If you add new operational dependencies, document how they affect readiness and deployment.

## Frontend standards

### Application structure
Current frontend organizes code under:
- `src/pages/`
- `src/components/`
- `src/services/`
- `src/hooks/`
- `src/context/`

Preferred direction:
- Put route-level UI in `pages/`.
- Put reusable UI in `components/`.
- Put API wrappers in `services/`.
- Put reusable stateful logic in `hooks/`.
- Put app-wide providers in `context/`.

### Routing and auth
- Protected routes should continue to use auth guard patterns like `RequireAuth`.
- Redirect unauthenticated users to the login route.
- Preserve first-time password-change flow.

### API access
- Prefer shared service wrappers over scattering raw endpoint strings.
- When editing existing areas, reduce divergence between Axios-based and `fetch`-based calls where practical.
- Verify API base URL behavior in the target environment before shipping changes.

### Error handling
- Keep user-facing errors readable.
- Avoid silent failures in async flows.
- Preserve the global error boundary and route-safe error handling patterns already in the app.

## Testing and quality

### Backend
Available scripts in `backend/package.json`:
- `bun run build`
- `bun run lint`
- `bun run test`
- `bun run test:cov`
- `bun run test:e2e`

### Frontend
Available scripts in `frontend/package.json`:
- `bun run build`
- `bun run lint`
- `bun run test:e2e`

### Expectations
- Run the narrowest relevant checks for the files you changed.
- Prefer build and lint verification for docs-adjacent config changes.
- Keep examples and instructions aligned with real scripts in package manifests.

## Security standards

- Never commit secrets or production credentials.
- Keep JWT and storage credentials in environment variables.
- Be conservative when documenting upload size, auth behavior, or public file access; verify in code first.
- Avoid broadening CORS, upload, or auth behavior without an explicit requirement.

## Current inconsistencies to keep in mind

These are real repo conditions, not desired end state:
- Backend route naming is mixed but largely Vietnamese for core academic/question/exam resources.
- Frontend API access is mixed between centralized services and inline `fetch` calls.
- Frontend config currently hardcodes an API base URL that may not match backend default port.
- Parser-related backend code exists both inside modules and in legacy controller paths.

## Reference docs

- `D:\Code\Graduation\docs\system-architecture.md`
- `D:\Code\Graduation\docs\project-roadmap.md`
- `D:\Code\Graduation\docs\REFACTOR_PLAN_DETAILED.md`
- `D:\Code\Graduation\docs\RENAME_MAP.md`
