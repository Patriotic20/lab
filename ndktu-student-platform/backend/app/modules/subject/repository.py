import logging

from fastapi import HTTPException, status
from app.models.subject.model import Subject
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.subject_teacher.model import SubjectTeacher
from app.models.user.model import User
from app.models.teacher.model import Teacher

from .schemas import (
    SubjectCreateRequest,
    SubjectListRequest,
    SubjectListResponse,
)

logger = logging.getLogger(__name__)


class SubjectRepository:
    async def create_subject(
        self, session: AsyncSession, data: SubjectCreateRequest
    ) -> Subject:
        stmt_check = select(Subject).where(Subject.name == data.name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{data.name}' already exists",
            )

        new_subject = Subject(name=data.name)
        session.add(new_subject)

        try:
            await session.commit()
            await session.refresh(new_subject)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_subject

    async def get_subject(
        self, session: AsyncSession, subject_id: int
    ) -> Subject:
        stmt = select(Subject).where(Subject.id == subject_id)
        result = await session.execute(stmt)
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
            )

        return subject

    async def list_subjects(
        self, session: AsyncSession, request: SubjectListRequest, current_user: User
    ) -> SubjectListResponse:
        stmt = select(Subject)

        is_teacher = any(role.name.lower() == "teacher" for role in current_user.roles)
        teacher_filter = None

        if is_teacher:
            st_stmt = select(SubjectTeacher.subject_id).join(Teacher, Teacher.id == SubjectTeacher.teacher_id).where(Teacher.user_id == current_user.id)
            st_result = await session.execute(st_stmt)
            allowed_subject_ids = st_result.scalars().all()

            if allowed_subject_ids:
                teacher_filter = Subject.id.in_(allowed_subject_ids)
            else:
                teacher_filter = Subject.id == -1

        if teacher_filter is not None:
            stmt = stmt.where(teacher_filter)

        if request.teacher_id:
             stmt = stmt.join(SubjectTeacher, Subject.id == SubjectTeacher.subject_id).where(SubjectTeacher.teacher_id == request.teacher_id)

        stmt = stmt.offset(request.offset).limit(request.limit)

        if request.name:
            stmt = stmt.where(Subject.name.ilike(f"%{request.name}%"))

        result = await session.execute(stmt)
        subjects = result.scalars().all()

        count_stmt = select(func.count()).select_from(Subject)

        if teacher_filter is not None:
            count_stmt = count_stmt.where(teacher_filter)

        if request.teacher_id:
             count_stmt = count_stmt.join(SubjectTeacher, Subject.id == SubjectTeacher.subject_id).where(SubjectTeacher.teacher_id == request.teacher_id)

        if request.name:
            count_stmt = count_stmt.where(Subject.name.ilike(f"%{request.name}%"))

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return SubjectListResponse(
            total=total, page=request.page, limit=request.limit, subjects=subjects
        )

    async def update_subject(
        self, session: AsyncSession, subject_id: int, data: SubjectCreateRequest
    ) -> Subject:
        stmt = select(Subject).where(Subject.id == subject_id)
        result = await session.execute(stmt)
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
            )

        if data.name is not None:
            stmt_check = select(Subject).where(
                Subject.name == data.name, Subject.id != subject_id
            )
            existing_subject = (
                await session.execute(stmt_check)
            ).scalar_one_or_none()
            if existing_subject:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject name already taken",
                )
            subject.name = data.name

        await session.commit()
        await session.refresh(subject)
        return subject

    async def delete_subject(
        self, session: AsyncSession, subject_id: int
    ) -> None:
        stmt = select(Subject).where(Subject.id == subject_id)
        result = await session.execute(stmt)
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
            )

        await session.delete(subject)
        await session.commit()


get_subject_repository = SubjectRepository()
