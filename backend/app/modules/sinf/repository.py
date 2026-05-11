import logging

from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.sinf.model import Sinf, SinfGroup
from app.modules.subject.models.subject import Subject
from app.modules.subject.models.subject_teacher import SubjectTeacher
from app.modules.teacher.model import Teacher
from app.modules.user.models.user import User

from .schemas import (
    SinfAcademicYearInfo,
    SinfCreateRequest,
    SinfGroupInfo,
    SinfListRequest,
    SinfListResponse,
    SinfResponse,
    SinfSubjectInfo,
    SinfTeacherInfo,
    SinfUpdateRequest,
)

logger = logging.getLogger(__name__)


class SinfRepository:
    async def _ensure_user_exists(self, session: AsyncSession, user_id: int) -> None:
        stmt = select(User.id).where(User.id == user_id)
        if (await session.execute(stmt)).scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Teacher user {user_id} not found")

    async def _ensure_subject_exists(self, session: AsyncSession, subject_id: int) -> None:
        stmt = select(Subject.id).where(Subject.id == subject_id)
        if (await session.execute(stmt)).scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject {subject_id} not found")

    async def _serialize(self, session: AsyncSession, sinf: Sinf) -> SinfResponse:
        teacher_full_name_stmt = select(Teacher.full_name).where(Teacher.user_id == sinf.teacher_id)
        teacher_full_name = (await session.execute(teacher_full_name_stmt)).scalar_one_or_none()

        return SinfResponse(
            id=sinf.id,
            name=sinf.name,
            description=sinf.description,
            subject_id=sinf.subject_id,
            teacher_id=sinf.teacher_id,
            academic_year_id=sinf.academic_year_id,
            semester_number=sinf.semester_number,
            subject=SinfSubjectInfo.model_validate(sinf.subject) if sinf.subject else None,
            teacher=SinfTeacherInfo(
                id=sinf.teacher.id,
                username=sinf.teacher.username,
                full_name=teacher_full_name,
            )
            if sinf.teacher
            else None,
            academic_year=SinfAcademicYearInfo.model_validate(sinf.academic_year) if sinf.academic_year else None,
            groups=[SinfGroupInfo.model_validate(g) for g in sinf.groups],
            created_at=sinf.created_at,
            updated_at=sinf.updated_at,
        )

    async def _load_with_relations(self, session: AsyncSession, sinf_id: int) -> Sinf:
        stmt = (
            select(Sinf)
            .options(
                selectinload(Sinf.subject),
                selectinload(Sinf.teacher),
                selectinload(Sinf.academic_year),
                selectinload(Sinf.groups),
            )
            .where(Sinf.id == sinf_id)
        )
        sinf = (await session.execute(stmt)).scalar_one_or_none()
        if not sinf:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sinf not found")
        return sinf

    async def create_sinf(self, session: AsyncSession, data: SinfCreateRequest) -> SinfResponse:
        await self._ensure_subject_exists(session, data.subject_id)
        await self._ensure_user_exists(session, data.teacher_id)

        sinf = Sinf(
            name=data.name,
            subject_id=data.subject_id,
            teacher_id=data.teacher_id,
            description=data.description,
            academic_year_id=data.academic_year_id,
            semester_number=data.semester_number,
        )
        session.add(sinf)
        await session.flush()

        for group_id in set(data.group_ids):
            session.add(SinfGroup(sinf_id=sinf.id, group_id=group_id))

        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating Sinf: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        loaded = await self._load_with_relations(session, sinf.id)
        return await self._serialize(session, loaded)

    async def get_sinf(self, session: AsyncSession, sinf_id: int) -> SinfResponse:
        sinf = await self._load_with_relations(session, sinf_id)
        return await self._serialize(session, sinf)

    async def list_sinfs(
        self,
        session: AsyncSession,
        request: SinfListRequest,
        current_user: User,
        restrict_to_teacher: bool,
    ) -> SinfListResponse:
        stmt = select(Sinf).options(
            selectinload(Sinf.subject),
            selectinload(Sinf.teacher),
            selectinload(Sinf.academic_year),
            selectinload(Sinf.groups),
        )
        count_stmt = select(func.count()).select_from(Sinf)

        filters = []
        if restrict_to_teacher:
            filters.append(Sinf.teacher_id == current_user.id)
        if request.teacher_id:
            filters.append(Sinf.teacher_id == request.teacher_id)
        if request.subject_id:
            filters.append(Sinf.subject_id == request.subject_id)
        if request.academic_year_id:
            filters.append(Sinf.academic_year_id == request.academic_year_id)
        if request.semester_number:
            filters.append(Sinf.semester_number == request.semester_number)
        if request.group_id:
            sub = select(SinfGroup.sinf_id).where(SinfGroup.group_id == request.group_id)
            filters.append(Sinf.id.in_(sub))

        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(desc(Sinf.id)).offset(request.offset).limit(request.limit)
        sinfs = (await session.execute(stmt)).scalars().all()
        total = (await session.execute(count_stmt)).scalar() or 0

        items = [await self._serialize(session, s) for s in sinfs]
        return SinfListResponse(total=total, page=request.page, limit=request.limit, sinfs=items)

    async def update_sinf(self, session: AsyncSession, sinf_id: int, data: SinfUpdateRequest) -> SinfResponse:
        sinf = await self._load_with_relations(session, sinf_id)

        if data.subject_id is not None and data.subject_id != sinf.subject_id:
            await self._ensure_subject_exists(session, data.subject_id)
            sinf.subject_id = data.subject_id
        if data.teacher_id is not None and data.teacher_id != sinf.teacher_id:
            await self._ensure_user_exists(session, data.teacher_id)
            sinf.teacher_id = data.teacher_id
        if data.name is not None:
            sinf.name = data.name
        if data.description is not None:
            sinf.description = data.description
        if data.academic_year_id is not None:
            sinf.academic_year_id = data.academic_year_id
        if data.semester_number is not None:
            sinf.semester_number = data.semester_number

        if data.group_ids is not None:
            existing_stmt = select(SinfGroup).where(SinfGroup.sinf_id == sinf.id)
            existing = {sg.group_id: sg for sg in (await session.execute(existing_stmt)).scalars().all()}
            requested = set(data.group_ids)

            for group_id, sg in existing.items():
                if group_id not in requested:
                    await session.delete(sg)

            for group_id in requested:
                if group_id not in existing:
                    session.add(SinfGroup(sinf_id=sinf.id, group_id=group_id))

        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating Sinf: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        loaded = await self._load_with_relations(session, sinf.id)
        return await self._serialize(session, loaded)

    async def delete_sinf(self, session: AsyncSession, sinf_id: int) -> None:
        sinf = await self._load_with_relations(session, sinf_id)
        await session.delete(sinf)
        await session.commit()

    async def user_owns_sinf(self, session: AsyncSession, sinf_id: int, user_id: int) -> bool:
        stmt = select(Sinf.id).where(Sinf.id == sinf_id, Sinf.teacher_id == user_id)
        return (await session.execute(stmt)).scalar_one_or_none() is not None

    async def get_sinf_orm(self, session: AsyncSession, sinf_id: int) -> Sinf:
        return await self._load_with_relations(session, sinf_id)

    async def get_or_create_subject_teacher_for_sinf(self, session: AsyncSession, sinf: Sinf) -> SubjectTeacher:
        teacher_stmt = select(Teacher).where(Teacher.user_id == sinf.teacher_id)
        teacher = (await session.execute(teacher_stmt)).scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {sinf.teacher_id} is not registered as a teacher",
            )

        st_stmt = select(SubjectTeacher).where(
            SubjectTeacher.subject_id == sinf.subject_id,
            SubjectTeacher.teacher_id == teacher.id,
        )
        subject_teacher = (await session.execute(st_stmt)).scalar_one_or_none()
        if subject_teacher:
            return subject_teacher

        subject_teacher = SubjectTeacher(subject_id=sinf.subject_id, teacher_id=teacher.id)
        session.add(subject_teacher)
        await session.flush()
        return subject_teacher


get_sinf_repository = SinfRepository()
