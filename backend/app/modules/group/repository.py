import logging

from fastapi import HTTPException, status
from app.models.group.model import Group
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.results.model import Result
from app.models.user.model import User
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
        self, session: AsyncSession, request: GroupListRequest, current_user: User
    ) -> GroupListResponse:
        stmt = select(Group)
        
        is_admin = any(role.name.lower() == "admin" for role in current_user.roles)
        is_teacher = any(role.name.lower() == "teacher" for role in current_user.roles)
        is_student = any(role.name.lower() == "student" for role in current_user.roles)

        # Track if we already joined GroupTeacher to avoid duplicate JOINs
        already_joined_group_teacher = False
        assigned_group_id = None

        if is_admin:
            # Admins see ALL groups — no filter applied, ignore request.teacher_id
            pass
        elif is_teacher:
            stmt = stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(
                GroupTeacher.teacher_id == current_user.id
            )
            already_joined_group_teacher = True
        elif is_student:
            from app.models.student.model import Student
            student_stmt = select(Student.group_id).where(Student.user_id == current_user.id)
            student_result = await session.execute(student_stmt)
            assigned_group_id = student_result.scalar_one_or_none()
            if assigned_group_id:
                stmt = stmt.where(Group.id == assigned_group_id)
            else:
                stmt = stmt.where(Group.id == -1)

        # Only apply explicit teacher_id filter for non-admin users
        # and only if it wasn't already joined via role-based filter
        if not is_admin and request.teacher_id and not already_joined_group_teacher:
            stmt = stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(
                GroupTeacher.teacher_id == request.teacher_id
            )

        if request.name:
            stmt = stmt.where(Group.name.ilike(f"%{request.name}%"))
        
        if request.faculty_id:
            stmt = stmt.where(Group.faculty_id == request.faculty_id)

        stmt = stmt.order_by(desc(Group.created_at))
        stmt = stmt.offset(request.offset).limit(request.limit)

        result = await session.execute(stmt)
        groups = result.scalars().all()

        # --- Count query ---
        count_stmt = select(func.count()).select_from(Group)

        if is_admin:
            pass
        elif is_teacher:
            count_stmt = count_stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(
                GroupTeacher.teacher_id == current_user.id
            )
        elif is_student:
            if assigned_group_id:
                count_stmt = count_stmt.where(Group.id == assigned_group_id)
            else:
                count_stmt = count_stmt.where(Group.id == -1)

        if not is_admin and request.teacher_id and not already_joined_group_teacher:
            count_stmt = count_stmt.join(GroupTeacher, Group.id == GroupTeacher.group_id).where(
                GroupTeacher.teacher_id == request.teacher_id
            )
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

        # FK ondelete="SET NULL" on Student.group_id and Result.group_id means
        # linked students/results lose their group reference but are NOT deleted.
        await session.delete(group)
        await session.commit()


get_group_repository = GroupRepository()
