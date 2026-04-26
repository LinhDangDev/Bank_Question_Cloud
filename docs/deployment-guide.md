# Deployment Guide

Last updated: 2026-04-27
Status: active

## Scope

This guide documents deployment and runtime setup paths that are verified from files currently in the repository. It does not assume all optional infrastructure is required for every environment.

## Deployment modes in repo

| Mode | Main files | Purpose |
|---|---|---|
| Local app processes | `backend/package.json`, `frontend/package.json` | Run frontend and backend directly for development |
| Local compose stack | `docker-compose.yml` | Start app plus optional supporting services |
| Production-oriented compose | `docker-compose.production.yml` | Run backend, Redis, and Nginx |
| Monitoring-only stack | `docker-compose.monitoring.yml`, `monitoring/` | Monitoring setup |

## Prerequisites

### Core
- Bun
- Node-compatible environment for frontend and backend tooling
- SQL Server access for the backend's current database baseline
- Redis for queue-backed features

### Optional, depending on workflow
- Docker and Docker Compose
- Python runtime for parser/export-related flows
- DigitalOcean Spaces or other object storage credentials if not using local storage
- Kafka, Qdrant, Prometheus, and Grafana if you are exercising those parts of the stack

## Environment configuration

### Backend
Use `D:\Code\Graduation\backend\.env.example` as the starting point.

Verified keys include:
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `STORAGE_PROVIDER`
- `PUBLIC_URL`
- storage-provider-specific keys
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

Notes:
- Backend bootstrap searches for `.env` in multiple locations.
- Backend default example port is `3001`.
- `STORAGE_PROVIDER=local` is the simplest local option.

### Frontend
The frontend package file does not expose a dedicated environment contract in the required source set. Current code hardcodes `API_BASE_URL` in `frontend/src/config.ts`.

Operational note:
- Frontend local development should call backend directly on `http://localhost:3001`.
- If frontend config still points elsewhere, treat that as config drift to be corrected.

## Local development

### Backend
```bash
cd backend
bun install
bun run dev
```

Expected behavior from code:
- API prefix: `/api`
- Swagger UI: `/api`
- Health endpoint: `/health`
- Metrics endpoint: `/metrics`

### Frontend
```bash
cd frontend
bun install
bun run dev
```

### Recommended local verification
After startup, verify:
- frontend loads
- backend responds on expected port
- `/api` Swagger UI is reachable through the path you expect
- frontend login requests reach the real backend

## Docker Compose: local stack

Primary file:
- `D:\Code\Graduation\docker-compose.yml`

### Services included
- `frontend`
- `backend`
- `redis`
- `zookeeper`
- `kafka`
- `qdrant`
- `prometheus`
- `grafana`

### Start the stack
```bash
docker compose up -d
```

### Notes
- This stack is broad and includes optional infrastructure.
- It is suitable for integration-style local work, not just minimal app startup.
- Backend loads env from `./backend/.env` in this compose file.

## Docker Compose: production-oriented stack

Primary file:
- `D:\Code\Graduation\docker-compose.production.yml`

### Services included
- `backend`
- `redis`
- `nginx`

### Start the stack
```bash
docker compose -f docker-compose.production.yml up -d
```

### Verified behavior
- Backend container listens on `3001` internally.
- Redis is required by backend configuration.
- Nginx proxies traffic to backend.
- Backend health check uses `http://localhost:3001/api/health` inside the container.

### Important path check
The production Nginx config should come from:
- `deployment/nginx/nginx.conf`
- `deployment/nginx/ssl`

If production compose still mounts from a top-level `nginx/` directory, treat that as compose drift to be corrected.

## Nginx behavior

Verified from `deployment/nginx/nginx.conf`:
- port 80 redirects to HTTPS
- port 443 proxies requests
- `/api/` goes to backend
- auth-related routes have stricter rate limiting
- upload-related routes allow larger request bodies and longer timeouts
- `/health` proxies to backend `/api/health`

## Monitoring deployment

Verified monitoring assets exist under `monitoring/`.

Expected components in repo:
- Prometheus config
- Grafana datasource config
- Grafana dashboard provisioning config

Use monitoring compose or service definitions only when you need observability locally or in a dedicated environment.

## File storage deployment notes

The backend supports at least two deployment patterns:
- local filesystem storage
- object storage via provider-specific env vars

For local-only deployments:
- keep `STORAGE_PROVIDER=local`
- ensure mounted or writable directories exist for uploads/public/output

For object storage deployments:
- configure the provider-specific env keys in backend env
- verify public URL/CDN behavior matches frontend expectations

## Health checks and smoke checks

### Backend checks
- `GET /health`
- `GET /ready`
- `GET /live`
- `GET /metrics`

### Via production Nginx
- `GET /health` should proxy to backend `/api/health`

### Recommended smoke flow
1. Start dependencies.
2. Start backend.
3. Confirm health endpoints.
4. Open Swagger UI.
5. Start frontend.
6. Test login flow.
7. Test at least one question-management API and one exam-related API.

## Known deployment ambiguities

| Issue | Why it matters |
|---|---|
| Frontend config points away from the confirmed direct backend target `http://localhost:3001` | Should be corrected to match intended local development flow |
| Production compose mounts `./nginx/...` instead of the confirmed `deployment/nginx/...` path | Should be corrected before production deployment |
| Multiple compose files exist | Teams should choose a canonical file per environment |
| Optional infra is present alongside core infra | New operators may over-provision unless requirements are clarified |

## Related docs

- `D:\Code\Graduation\docs\system-architecture.md`
- `D:\Code\Graduation\docs\codebase-summary.md`
- `D:\Code\Graduation\docs\project-roadmap.md`
