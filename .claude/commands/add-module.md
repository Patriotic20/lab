---
description: Scaffold a new backend module per CLAUDE.md conventions (model + schemas + repository + router) and wire it up
argument-hint: <module_name>
---

Create a new backend module named **`$ARGUMENTS`** under `backend/app/modules/$ARGUMENTS/`, following the project conventions in [CLAUDE.md](CLAUDE.md) (section "Module structure").

If `$ARGUMENTS` is empty, ask the user for the module name (snake_case, singular) before doing anything else.

## Reference

Use the **faculty** module as your structural template — copy its layout, swap names/fields:

- [backend/app/modules/faculty/model.py](backend/app/modules/faculty/model.py)
- [backend/app/modules/faculty/schemas.py](backend/app/modules/faculty/schemas.py)
- [backend/app/modules/faculty/repository.py](backend/app/modules/faculty/repository.py)
- [backend/app/modules/faculty/router.py](backend/app/modules/faculty/router.py)

## Steps

1. Read [CLAUDE.md](CLAUDE.md) "Module structure" + "core/ shared infrastructure" sections.
2. Read all four faculty files above to learn the exact conventions used in *this* project (imports, decorators, `PermissionRequired` pattern, `RateLimiter`, response models, naming).
3. Ask the user (one short message, list the questions) for:
   - The fields the model should have (name + type — use the field tokens from CLAUDE.md: `str`, `text`, `int`, `bool`, `float`, `json`, `fk:ModelName`).
   - Whether any field should be unique / nullable / indexed.
   - Whether this module is owned by a fixed role (Admin / Teacher / Student / User) — affects which permissions exist by default.
4. Create directory `backend/app/modules/$ARGUMENTS/` with these files:
   - `__init__.py` — empty
   - `model.py` — SQLAlchemy ORM model. Inherit from `Base` (`from app.core.base import Base`), use `IdIntPk` and `TimestampMixin` from `app.core`. Use string-literal relationships for cross-module FKs and `TYPE_CHECKING` guards (see CLAUDE.md "Import rule").
   - `schemas.py` — Pydantic Create/Update/List/Response schemas, mirroring faculty's structure.
   - `repository.py` — async DB queries. **No business logic here** — pure CRUD. Mirror faculty's class + singleton pattern.
   - `router.py` — `APIRouter(tags=["$ARGUMENTS"], prefix="/$ARGUMENTS")` with create/get/list/update/delete endpoints. Wire each with `PermissionRequired("<action>:$ARGUMENTS")` dependency and `RateLimiter` on mutations.
5. Wire the module into the app:
   - Add `from .$ARGUMENTS.router import router as ${ARGUMENTS}_router` and `router.include_router(${ARGUMENTS}_router)` to [backend/app/modules/router.py](backend/app/modules/router.py).
   - Add the model import + `__all__` entry to [backend/app/core/models_registry.py](backend/app/core/models_registry.py) so Alembic picks it up.
6. Print a summary table at the end:
   - List of files created
   - List of files modified
   - The exact command the user should run next to create the migration: `/migrate "add $ARGUMENTS module"`

## Constraints

- **Do NOT** run alembic, migrations, or any docker commands. Migrations are a separate step.
- **Do NOT** create a `view.py` — sqladmin views were removed from modules in this project (see CLAUDE.md "core/admin_views.py" note).
- **Do NOT** invent fields the user didn't ask for.
- If the module name conflicts with an existing one (`ls backend/app/modules/`), stop and warn the user.
