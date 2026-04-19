# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This monorepo contains three sub-projects:

| Directory | Purpose |
|---|---|
| `ndktu-student-platform/` | Main platform: FastAPI backend + React frontend |
| `ndktu-student-face-detection/` | Standalone face-detection microservice (MediaPipe + face_recognition) |
| Root `docker-compose.yml` | Orchestrates all services together |

All work below assumes the main platform at `ndktu-student-platform/`.

---

## Commands

### Development (Docker)

```bash
make up          # Build and start all services (backend :8000, frontend :3000, postgres :5436, redis :6379, pgadmin :5050)
make down        # Stop all services
make logs        # Tail all logs
make backend-logs
make frontend-logs
```

Production uses nginx reverse proxy:
```bash
make prod-up
make prod-down
make deploy      # Zero-downtime redeploy (backend then frontend)
```

### Backend (inside container or with uv)

```bash
# Run from ndktu-student-platform/backend/
uv run python -m pytest app/test/              # All tests
uv run python -m pytest app/test/test_faculty.py -x -q  # Single test file
uv run ruff check app/                         # Lint
uv run ruff format app/                        # Format
```

Tests require a running PostgreSQL + Redis (use Docker).

### Migrations (run via Docker exec)

```bash
# Create + apply a migration (container must be running)
docker exec nusmt_backend sh -c "cd /face/app && uv run alembic revision --autogenerate -m 'description'"
docker cp nusmt_backend:/face/app/migrations/versions/. ./backend/app/migrations/versions/
docker exec nusmt_backend sh -c "cd /face/app && uv run alembic upgrade head"

# Or use the Makefile shortcut (hardcoded message — edit Makefile first):
make migrate
```

### Frontend

```bash
# Run from ndktu-student-platform/frontend/
npm run dev      # Vite dev server
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
```

---

## Backend architecture

### Config system

All settings live in `backend/app/core/config.py` via `pydantic-settings`. Every env var uses the prefix `APP_CONFIG__` with double-underscores for nesting (e.g. `APP_CONFIG__DATABASE__URL`). The `.env` file is loaded from `backend/.env`.

### Request lifecycle

```
HTTP request
  → CORSMiddleware / ForceHTTPSMiddleware / LoggingMiddleware
  → FastAPI router  (app/modules/router.py  aggregates all module routers)
  → route endpoint  (modules/<domain>/router.py)
  → PermissionRequired dependency  (dependence/role_checker.py)
  → repository      (modules/<domain>/repository.py)
  → SQLAlchemy async session  (core/db_helper.py)
```

### Module structure

Each domain lives entirely in `app/modules/<domain>/` and contains:

```
modules/<domain>/
  model.py        ← SQLAlchemy ORM model (canonical location since refactor)
  view.py         ← SQLAlchemy-Admin (sqladmin) view
  router.py       ← FastAPI APIRouter with endpoints
  repository.py   ← async DB queries (no business logic)
  schemas.py      ← Pydantic request/response models
  service.py      ← optional; heavier business logic (auth, HEMIS sync, etc.)
```

Join-table models live inside the owning module with a prefix:
- `modules/group/model_group_teachers.py` → `GroupTeacher`
- `modules/role/model_role_permission.py` → `RolePermission`
- `modules/subject/model_subject_teacher.py` → `SubjectTeacher`
- `modules/user/model_user_role.py` → `UserRole`
- `modules/quiz/model_quiz_questions.py` → `QuizQuestion`

### core/ shared infrastructure

- `core/base.py` — `Base` (DeclarativeBase), imported by every model
- `core/mixins/id_int_pk.py` — `IdIntPk` primary-key mixin
- `core/mixins/time_stamp_mixin.py` — `TimestampMixin` (created_at/updated_at)
- `core/models_registry.py` — imports all 22 model classes; used by Alembic `env.py` to populate `Base.metadata`
- `core/admin_views.py` — `register_models(admin)` stub; no sqladmin views are registered (views removed from modules)

**Import rule:** In model files use `from app.core.base import Base`. Cross-module relationships must use string literals (`relationship("User")`) and `TYPE_CHECKING` guards to avoid circular imports at runtime.

### Authorization

`PermissionRequired("action:resource")` is a FastAPI dependency class in `dependence/role_checker.py`.  
On app startup (`lifespan` → `core/init_db.py`), all routes are scanned for `PermissionRequired` instances and permissions are auto-created in the database and assigned to roles.  
Fixed roles: **Admin** (all permissions), **Teacher** (quiz/question/statistics/result/subject/resource), **Student** (read quiz/result + quiz_process), **User** (user:me only).

### HEMIS integration

`modules/hemis/service.py` authenticates students via the external HEMIS API and syncs student data. HEMIS credentials and endpoints are configured in `AppConfig.hemis`.

### Quiz process flow

1. Student calls `POST /quiz_process/start` → creates in-memory session (Redis-cached)
2. Answers submitted per question
3. `POST /quiz_process/end` → scores, creates `Result`, clears cache
4. Cheating detection: base64-encoded frames are uploaded mid-quiz; face comparison runs via `ndktu-student-face-detection` service

---

## Frontend architecture

React 19 + Vite + TypeScript + Tailwind CSS.

- **State:** React Query (`@tanstack/react-query`) for all server state; custom hooks in `src/hooks/use*.ts` wrap service calls
- **Auth:** JWT stored in localStorage; `src/context/AuthContext.tsx` exposes user/roles; `src/lib/tokens.ts` handles token refresh
- **Services:** `src/services/*.ts` — one file per API domain, all using the shared `axios` instance from `src/services/api.ts`
- **Forms:** react-hook-form + zod
- **Routing:** react-router-dom v7

API base URL is read from `src/config/env.ts` (`VITE_API_URL`).

---

## Adding a new model

1. Create `modules/<domain>/model.py` — inherit from `Base`, use `IdIntPk`/`TimestampMixin` from `app.core`; use string literals for cross-module relationships
2. Register in `core/models_registry.py` — add import and `__all__` entry
3. Run Alembic migration (see Commands above)

Field type tokens for model columns: `str` → `String(255)`, `text` → `Text`, `int` → `Integer`, `bool` → `Boolean`, `float` → `Float`, `json` → `JSONB`, `fk:ModelName` → `ForeignKey`.
