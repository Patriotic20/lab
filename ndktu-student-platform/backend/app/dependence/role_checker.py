import logging

import jwt
from core.config import settings
from core.db_helper import db_helper
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from jwt import PyJWTError
from app.models.permission.model import Permission
from app.models.role.model import Role
from app.models.role_permission.model import RolePermission
from app.models.user.model import User
from app.models.user_role.model import UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

# Используем заголовок Authorization
api_key_header = APIKeyHeader(name="Authorization")


async def get_current_user_id(token: str = Depends(api_key_header)):
    # Если токен приходит как "Bearer <token>", нужно убрать префикс
    if token.startswith("Bearer "):
        token = token.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token, settings.jwt.access_token_secret, algorithms=[settings.jwt.algorithm]
        )
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user_id missing",
            )
        return user_id
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


class PermissionRequired:
    def __init__(self, permission_name: str):
        self.permission_name = permission_name

    async def __call__(
        self,
        user_id: int = Depends(get_current_user_id),
        session: AsyncSession = Depends(db_helper.session_getter),
    ) -> User:
        # Загружаем пользователя с ролями один раз
        user_stmt = (
            select(User).where(User.id == user_id).options(selectinload(User.roles))
        )
        result = await session.execute(user_stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Проверяем, является ли пользователь админом
        is_admin = any(role.name == "Admin" for role in user.roles)

        if is_admin:
            return user  # Админ имеет доступ ко всему

        # Для не-админов проверяем конкретное разрешение
        # Permissions are created at startup by init_db, no need to create here
        perm_stmt = select(Permission).where(Permission.name == self.permission_name)
        perm_result = await session.execute(perm_stmt)
        perm_obj = perm_result.scalar_one_or_none()

        if not perm_obj:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{self.permission_name}' not found. Restart the app to sync permissions.",
            )

        # 2. Проверяем наличие права у пользователя
        perm_check_stmt = (
            select(Permission.id)
            .join(RolePermission)
            .join(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id, Permission.name == self.permission_name)
        )
        perm_check_result = await session.execute(perm_check_stmt)
        has_permission = perm_check_result.scalars().first()

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: user lacks '{self.permission_name}' permission",
            )

        return user
