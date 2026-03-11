import logging

from fastapi import HTTPException, status
from app.models.group.model import Group
from sqlalchemy import func, select
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.group_teachers.model import GroupTeacher

from .schemas import (
    GroupCreateRequest,
    GroupListRequest,
    GroupListResponse,
)

logger = logging.getLogger(__name__)


class GroupRepository:
    async def create_group(
        self, session: AsyncSession, data: GroupCreateRequest
    ) -> Group:
        stmt_check = select(Group).where(Group.name == data.name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{data.name}' already exists",
            )

        new_group = Group(name=data.name, faculty_id=data.faculty_id)
        session.add(new_group)

        try:
            await session.commit()
            await session.refresh(new_group)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_group

    async def get_group(
        self, session: AsyncSession, group_id: int
    ) -> Group:
        stmt = select(Group).where(Group.id == group_id)
        result = await session.execute(stmt)
        group = result.scalar_one_or_none()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )

        return group

    async def list_groups(
        self, session: AsyncSession, request: GroupListRequest
    ) -> GroupListResponse:
        stmt = select(Group)
        
        if request.teacher_id:
             stmt = stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(GroupTeacher.teacher_id == request.teacher_id)

        stmt = stmt.offset(request.offset).limit(request.limit)

        if request.name:
            stmt = stmt.where(Group.name.ilike(f"%{request.name}%"))
        
        if request.faculty_id:
            stmt = stmt.where(Group.faculty_id == request.faculty_id)

        result = await session.execute(stmt)
        groups = result.scalars().all()

        count_stmt = select(func.count()).select_from(Group)
        if request.teacher_id:
            count_stmt = count_stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(GroupTeacher.teacher_id == request.teacher_id)
        if request.name:
            count_stmt = count_stmt.where(Group.name.ilike(f"%{request.name}%"))
        if request.faculty_id:
            count_stmt = count_stmt.where(Group.faculty_id == request.faculty_id)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return GroupListResponse(
            total=total, page=request.page, limit=request.limit, groups=groups
        )

    async def update_group(
        self, session: AsyncSession, group_id: int, data: GroupCreateRequest
    ) -> Group:
        stmt = select(Group).where(Group.id == group_id)
        result = await session.execute(stmt)
        group = result.scalar_one_or_none()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )

        if data.name is not None:
            # Check unique name excluding current
            stmt_check = select(Group).where(
                Group.name == data.name, Group.id != group_id
            )
            existing = (await session.execute(stmt_check)).scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Group name already taken",
                )
            group.name = data.name
        
        if data.faculty_id is not None:
             group.faculty_id = data.faculty_id

        await session.commit()
        await session.refresh(group)
        return group

    async def delete_group(
        self, session: AsyncSession, group_id: int
    ) -> None:
        stmt = select(Group).where(Group.id == group_id)
        result = await session.execute(stmt)
        group = result.scalar_one_or_none()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )

        await session.delete(group)
        await session.commit()


get_group_repository = GroupRepository()
