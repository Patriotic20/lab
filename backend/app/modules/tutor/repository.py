import logging

from fastapi import HTTPException, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.group.models.group import Group
from app.modules.tutor.models.tutor import Tutor
from app.modules.tutor.models.tutor_groups import TutorGroup
from app.modules.user.models.user import User

from .schemas import (
    TutorAssignGroupsRequest,
    TutorCreateRequest,
    TutorListRequest,
    TutorListResponse,
    TutorUpdateRequest,
)

logger = logging.getLogger(__name__)


class TutorRepository:
    def _eager_options(self):
        return [
            selectinload(Tutor.user),
            selectinload(Tutor.tutor_groups).selectinload(TutorGroup.group),
        ]

    async def create_tutor(self, session: AsyncSession, data: TutorCreateRequest) -> Tutor:
        user = (
            await session.execute(select(User).where(User.id == data.user_id))
        ).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = (
            await session.execute(select(Tutor).where(Tutor.user_id == data.user_id))
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tutor for this user already exists",
            )

        tutor = Tutor(
            user_id=data.user_id,
            first_name=data.first_name,
            last_name=data.last_name,
            third_name=data.third_name,
            image_url=data.image_url,
            phone_number=data.phone_number,
        )
        session.add(tutor)
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )

        stmt = select(Tutor).options(*self._eager_options()).where(Tutor.id == tutor.id)
        return (await session.execute(stmt)).scalar_one()

    async def get_tutor(self, session: AsyncSession, tutor_id: int) -> Tutor:
        stmt = select(Tutor).options(*self._eager_options()).where(Tutor.id == tutor_id)
        tutor = (await session.execute(stmt)).scalar_one_or_none()
        if not tutor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
        return tutor

    async def list_tutors(
        self, session: AsyncSession, request: TutorListRequest
    ) -> TutorListResponse:
        stmt = select(Tutor).options(*self._eager_options())

        if request.search:
            term = f"%{request.search}%"
            stmt = stmt.where(
                or_(
                    Tutor.first_name.ilike(term),
                    Tutor.last_name.ilike(term),
                    Tutor.third_name.ilike(term),
                )
            )

        stmt = stmt.order_by(desc(Tutor.created_at)).offset(request.offset).limit(request.limit)
        tutors = (await session.execute(stmt)).scalars().all()

        count_stmt = select(func.count()).select_from(Tutor)
        if request.search:
            term = f"%{request.search}%"
            count_stmt = count_stmt.where(
                or_(
                    Tutor.first_name.ilike(term),
                    Tutor.last_name.ilike(term),
                    Tutor.third_name.ilike(term),
                )
            )
        total = (await session.execute(count_stmt)).scalar() or 0

        return TutorListResponse(
            total=total, page=request.page, limit=request.limit, tutors=tutors
        )

    async def update_tutor(
        self, session: AsyncSession, tutor_id: int, data: TutorUpdateRequest
    ) -> Tutor:
        stmt = select(Tutor).options(*self._eager_options()).where(Tutor.id == tutor_id)
        tutor = (await session.execute(stmt)).scalar_one_or_none()
        if not tutor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")

        for field in ("first_name", "last_name", "third_name", "image_url", "phone_number"):
            value = getattr(data, field)
            if value is not None:
                setattr(tutor, field, value)

        await session.commit()
        await session.refresh(tutor)
        return tutor

    async def delete_tutor(self, session: AsyncSession, tutor_id: int) -> None:
        tutor = (
            await session.execute(select(Tutor).where(Tutor.id == tutor_id))
        ).scalar_one_or_none()
        if not tutor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")

        await session.delete(tutor)
        await session.commit()

    async def assign_groups(
        self, session: AsyncSession, data: TutorAssignGroupsRequest
    ) -> None:
        stmt = (
            select(Tutor)
            .options(selectinload(Tutor.tutor_groups))
            .where(Tutor.id == data.tutor_id)
        )
        tutor = (await session.execute(stmt)).scalar_one_or_none()
        if not tutor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")

        for tg in tutor.tutor_groups:
            await session.delete(tg)
        await session.flush()

        if data.group_ids:
            groups = (
                await session.execute(select(Group).where(Group.id.in_(data.group_ids)))
            ).scalars().all()
            if len(groups) != len(set(data.group_ids)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more group_ids are invalid",
                )
            for group_id in set(data.group_ids):
                session.add(TutorGroup(tutor_id=data.tutor_id, group_id=group_id))

        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while assigning groups",
            )

    async def get_groups_by_tutor(self, session: AsyncSession, tutor_id: int) -> Tutor:
        return await self.get_tutor(session=session, tutor_id=tutor_id)


get_tutor_repository = TutorRepository()
