import logging

from fastapi import HTTPException, status
from app.models.yakuniy.model import Yakuniy
from app.models.user.model import User
from sqlalchemy import func, select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    YakuniyCreateRequest,
    YakuniyUpdateRequest,
    YakuniyListRequest,
    YakuniyListResponse,
)

logger = logging.getLogger(__name__)


class YakuniyRepository:
    async def create_yakuniy(
        self, session: AsyncSession, data: YakuniyCreateRequest
    ) -> Yakuniy:
        new_yakuniy = Yakuniy(
            user_id=data.user_id,
            subject_id=data.subject_id,
            grade=data.grade,
        )
        session.add(new_yakuniy)

        try:
            await session.commit()
            await session.refresh(new_yakuniy)
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating yakuniy: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

        # Reload with relationships
        return await self.get_yakuniy(session=session, yakuniy_id=new_yakuniy.id)

    async def get_yakuniy(
        self, session: AsyncSession, yakuniy_id: int
    ) -> Yakuniy:
        stmt = select(Yakuniy).options(
            selectinload(Yakuniy.user).selectinload(User.student),
            selectinload(Yakuniy.subject),
        ).where(Yakuniy.id == yakuniy_id)
        result = await session.execute(stmt)
        yakuniy = result.scalar_one_or_none()

        if not yakuniy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Yakuniy not found"
            )

        return yakuniy

    async def list_yakuniy(
        self, session: AsyncSession, request: YakuniyListRequest
    ) -> YakuniyListResponse:
        stmt = select(Yakuniy).options(
            selectinload(Yakuniy.user).selectinload(User.student),
            selectinload(Yakuniy.subject),
        )

        if request.user_id:
            stmt = stmt.where(Yakuniy.user_id == request.user_id)
        if request.subject_id:
            stmt = stmt.where(Yakuniy.subject_id == request.subject_id)
        if request.grade is not None:
            stmt = stmt.where(Yakuniy.grade == request.grade)
        if request.username:
            stmt = stmt.join(User, Yakuniy.user_id == User.id).where(
                User.username.ilike(f"%{request.username}%")
            )

        stmt = stmt.order_by(desc(Yakuniy.created_at))
        stmt = stmt.offset(request.offset).limit(request.limit)

        result = await session.execute(stmt)
        yakuniy_results = result.scalars().all()

        # Count
        count_stmt = select(func.count()).select_from(Yakuniy)
        if request.user_id:
            count_stmt = count_stmt.where(Yakuniy.user_id == request.user_id)
        if request.subject_id:
            count_stmt = count_stmt.where(Yakuniy.subject_id == request.subject_id)
        if request.grade is not None:
            count_stmt = count_stmt.where(Yakuniy.grade == request.grade)
        if request.username:
            count_stmt = count_stmt.join(User, Yakuniy.user_id == User.id).where(
                User.username.ilike(f"%{request.username}%")
            )

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return YakuniyListResponse(
            total=total, page=request.page, limit=request.limit, yakuniy_results=yakuniy_results
        )

    async def update_yakuniy(
        self, session: AsyncSession, yakuniy_id: int, data: YakuniyUpdateRequest
    ) -> Yakuniy:
        stmt = select(Yakuniy).options(
            selectinload(Yakuniy.user).selectinload(User.student),
            selectinload(Yakuniy.subject),
        ).where(Yakuniy.id == yakuniy_id)
        result = await session.execute(stmt)
        yakuniy = result.scalar_one_or_none()

        if not yakuniy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Yakuniy not found"
            )

        if data.user_id is not None:
            yakuniy.user_id = data.user_id
        if data.subject_id is not None:
            yakuniy.subject_id = data.subject_id
        if data.grade is not None:
            yakuniy.grade = data.grade

        await session.commit()
        await session.refresh(yakuniy)
        return yakuniy

    async def delete_yakuniy(
        self, session: AsyncSession, yakuniy_id: int
    ) -> None:
        stmt = select(Yakuniy).where(Yakuniy.id == yakuniy_id)
        result = await session.execute(stmt)
        yakuniy = result.scalar_one_or_none()

        if not yakuniy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Yakuniy not found"
            )

        await session.delete(yakuniy)
        await session.commit()


get_yakuniy_repository = YakuniyRepository()
