
import logging
from fastapi import FastAPI
from fastapi.routing import APIRoute
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.role.model import Role
from app.models.permission.model import Permission
from app.models.role_permission.model import RolePermission
from dependence.role_checker import PermissionRequired
import inspect

logger = logging.getLogger(__name__)


def discover_permissions(app: FastAPI) -> set[str]:
    """
    Scans ALL FastAPI app routes to discover permissions defined in PermissionRequired dependencies.
    Checks both route-level dependencies AND function-parameter-level Depends().
    """
    permissions = set()
    logger.info(f"Scanning {len(app.routes)} routes for permissions...")

    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue

        # 1. Check route-level dependencies (e.g., dependencies=[Depends(...)])
        for dependency in route.dependencies:
            dep_callable = dependency.dependency
            if isinstance(dep_callable, PermissionRequired):
                permissions.add(dep_callable.permission_name)

        # 2. Check function-parameter-level Depends (e.g., _: ... = Depends(PermissionRequired("...")))
        endpoint = route.endpoint
        sig = inspect.signature(endpoint)
        for param in sig.parameters.values():
            if param.default is inspect.Parameter.empty:
                continue
            # FastAPI Depends wraps the actual callable
            dep = param.default
            if hasattr(dep, "dependency"):
                dep_callable = dep.dependency
                if isinstance(dep_callable, PermissionRequired):
                    permissions.add(dep_callable.permission_name)

    return permissions


async def init_db(app: FastAPI, session: AsyncSession):
    """
    Initialize roles and permissions in the database using dynamic discovery.
    """
    try:
        logger.info("Initializing roles and permissions...")

        # 0. Discover Permissions from all routes
        discovered_permissions = discover_permissions(app)
        logger.info(f"Discovered {len(discovered_permissions)} permissions: {discovered_permissions}")

        if not discovered_permissions:
            logger.warning("No permissions discovered! Check your routes.")
            return

        # 1. Reset sequences to avoid UniqueViolation errors
        # Use GREATEST(..., 1) because setval cannot accept 0
        # Third arg 'false' means next nextval() returns this value (safe for empty tables)
        await session.execute(
            text("SELECT setval('permissions_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM permissions), 1), (SELECT COUNT(*) > 0 FROM permissions))")
        )
        await session.execute(
            text("SELECT setval('roles_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM roles), 1), (SELECT COUNT(*) > 0 FROM roles))")
        )
        await session.execute(
            text("SELECT setval('role_permissions_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM role_permissions), 1), (SELECT COUNT(*) > 0 FROM role_permissions))")
        )

        # 2. Create/Update Permissions
        existing_perms_stmt = select(Permission)
        existing_perms_result = await session.execute(existing_perms_stmt)
        existing_perms = {p.name: p for p in existing_perms_result.scalars().all()}

        new_perms = []
        for perm_name in discovered_permissions:
            if perm_name not in existing_perms:
                new_perm = Permission(name=perm_name)
                session.add(new_perm)
                new_perms.append(perm_name)

        if new_perms:
            await session.commit()
            logger.info(f"Created {len(new_perms)} new permissions: {new_perms}")
            # Reload to get IDs
            existing_perms_result = await session.execute(select(Permission))
            existing_perms = {p.name: p for p in existing_perms_result.scalars().all()}
        else:
            logger.info("All discovered permissions already exist.")

        # 3. Create Roles
        ROLES = ["Admin", "Teacher", "Student", "User"]
        existing_roles_stmt = select(Role)
        existing_roles_result = await session.execute(existing_roles_stmt)
        existing_roles = {r.name: r for r in existing_roles_result.scalars().all()}

        for role_name in ROLES:
            if role_name not in existing_roles:
                new_role = Role(name=role_name)
                session.add(new_role)
                await session.flush()
                existing_roles[role_name] = new_role
                logger.info(f"Created new role: {role_name}")

        await session.commit()

        # 4. Assign Permissions to Roles
        # Admin gets ALL permissions
        admin_perms = discovered_permissions

        # Teacher gets questions, quizzes, statistics, results, subjects
        teacher_perms = {
            p for p in discovered_permissions
            if any(keyword in p for keyword in ("question", "quiz", "statistics", "result", "teacher", "subject"))
        }
        if "read:role" in discovered_permissions:
            teacher_perms.add("read:role")
        if "user:me" in discovered_permissions:
            teacher_perms.add("user:me")

        # Student gets read-only quiz/result + quiz process + user:me
        student_perms = {
            p for p in discovered_permissions
            if (
                p == "read:quiz"
                or p == "read:result"
                or p.startswith("quiz_process:")
                or p == "user_answers:read"
            )
        }
        if "user:me" in discovered_permissions:
            student_perms.add("user:me")

        user_perms = {"user:me"} if "user:me" in discovered_permissions else set()

        ROLE_PERMISSIONS_MAP = {
            "Admin": admin_perms,
            "Teacher": teacher_perms,
            "Student": student_perms,
            "User": user_perms,
        }

        for role_name, target_perm_names in ROLE_PERMISSIONS_MAP.items():
            role = existing_roles.get(role_name)
            if not role:
                logger.warning(f"Role '{role_name}' not found, skipping permission assignment.")
                continue

            # Get current permissions for this role
            current_role_perms_stmt = select(RolePermission).where(RolePermission.role_id == role.id)
            current_role_perms_result = await session.execute(current_role_perms_stmt)
            current_role_perm_ids = {rp.permission_id for rp in current_role_perms_result.scalars().all()}

            assigned_count = 0
            for perm_name in target_perm_names:
                perm = existing_perms.get(perm_name)
                if perm and perm.id not in current_role_perm_ids:
                    session.add(RolePermission(role_id=role.id, permission_id=perm.id))
                    assigned_count += 1

            if assigned_count > 0:
                logger.info(f"Assigned {assigned_count} new permissions to role '{role_name}'")

        await session.commit()
        logger.info("Roles and permissions initialization complete.")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        await session.rollback()
        raise e
