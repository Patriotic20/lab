import logging

from fastapi import HTTPException, status
from app.models.role.model import Role
from app.models.user.model import User
from app.models.student.model import Student
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.teacher.model import Teacher

from .schemas import (
    UserCreateRequest,
    UserListRequest,
    UserListResponse,
    UserListResponse,
    UserUpdateRequest,
    UserRoleAssignRequest,
)

logger = logging.getLogger(__name__)


class UserRepository:
    async def create_user(self, session: AsyncSession, data: UserCreateRequest) -> User:
        # Проверка на существование
        stmt_check = select(User).where(User.username == data.username)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )

        roles = []
        if data.roles:
            role_names = [role.name for role in data.roles]
            # Получаем объекты ролей
            stmt_roles = select(Role).where(Role.name.in_(role_names))
            result_roles = await session.execute(stmt_roles)
            roles = result_roles.scalars().all()

            if len(roles) != len(data.roles):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more roles not found",
                )

        # Создаем пользователя. Пароль уже захэширован 
        # внутри UserCreateRequest (field_validator)
        new_user = User(username=data.username, password=data.password, roles=roles)

        session.add(new_user)
        try:
            await session.commit()
            await session.refresh(new_user, attribute_names=["roles"])
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        return new_user

    async def get_user(self, session: AsyncSession, user_id: int) -> User:
        stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return user

    async def list_users(
        self, session: AsyncSession, request: UserListRequest
    ) -> UserListResponse:
        # 1. Запрос на получение моделей
        stmt = (
            select(User)
            .options(
                selectinload(User.roles),
                selectinload(User.teacher).selectinload(Teacher.kafedra),
                selectinload(User.student).selectinload(Student.group)
            )
            .offset(request.offset)
            .limit(request.limit)
        )

        if request.username:
            stmt = stmt.where(User.username.ilike(f"%{request.username}%"))

        result = await session.execute(stmt)
        users = result.scalars().all()

        # 2. Запрос на общее количество
        count_stmt = select(func.count()).select_from(User)
        if request.username:
            count_stmt = count_stmt.where(User.username.ilike(f"%{request.username}%"))

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        # 3. Возвращаем UserListResponse, используя данные из моделей.
        # Чтобы UserCreateResponse (внутри списка) корректно обработал роли,
        # в схеме UserCreateResponse нужно будет добавить преобразование 
        # списка объектов в список строк.
        return UserListResponse(
            total=total,
            page=request.page,
            limit=request.limit,
            users=users,  # Передаем объекты моделей, Pydantic сам их провалидирует
        )

    async def update_user(
        self, session: AsyncSession, user_id: int, data: UserUpdateRequest
    ) -> User:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Частичное обновление через Request схему
        if data.username is not None:
            user.username = data.username
        if data.password is not None:
            user.password = data.password

        await session.commit()
        await session.refresh(user)
        return user

    async def delete_user(self, session: AsyncSession, user_id: int) -> None:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        await session.delete(user)
        await session.commit()


    async def assign_roles(
        self, session: AsyncSession, data: UserRoleAssignRequest
    ) -> None:
        # 1. Fetch User
        stmt = select(User).where(User.id == data.user_id).options(selectinload(User.roles))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        
        # 2. Fetch Roles
        if not data.role_ids:
            # If empty list provided, remove all roles? 
            # Or assume explicit clear. Let's allowing clearing.
            user.roles = []
        else:
            stmt_roles = select(Role).where(Role.id.in_(data.role_ids))
            result_roles = await session.execute(stmt_roles)
            roles = result_roles.scalars().all()
            
            if len(roles) != len(data.role_ids):
                 # Some roles found, some not. 
                 # Strict check: all IDs must be valid.
                 found_ids = {r.id for r in roles}
                 missing_ids = set(data.role_ids) - found_ids
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Roles with ids {missing_ids} not found"
                )
            
            # 3. Assign
            user.roles = list(roles)
            
        try:
            await session.commit()
        except Exception:
             await session.rollback()
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while assigning roles"
            )

import logging

logger = logging.getLogger(__name__)


get_user_repository = UserRepository()