import logging

from fastapi import HTTPException, status
from app.models.faculty.model import Faculty
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    FacultyCreateRequest,
    FacultyListRequest,
    FacultyListResponse,
)

logger = logging.getLogger(__name__)


class FacultyRepository:
    async def create_faculty(
        self, session: AsyncSession, data: FacultyCreateRequest
    ) -> Faculty:
        stmt_check = select(Faculty).where(Faculty.name == data.name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Faculty '{data.name}' already exists",
            )

        new_faculty = Faculty(name=data.name)
        session.add(new_faculty)

        try:
            await session.commit()
            await session.refresh(new_faculty)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_faculty

    async def get_faculty(
        self, session: AsyncSession, faculty_id: int
    ) -> Faculty:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        result = await session.execute(stmt)
        faculty = result.scalar_one_or_none()

        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found"
            )

        return faculty

    async def list_faculties(
        self, session: AsyncSession, request: FacultyListRequest
    ) -> FacultyListResponse:
        stmt = select(Faculty).offset(request.offset).limit(request.limit)

        if request.name:
            stmt = stmt.where(Faculty.name.ilike(f"%{request.name}%"))

        result = await session.execute(stmt)
        faculties = result.scalars().all()

        count_stmt = select(func.count()).select_from(Faculty)
        if request.name:
            count_stmt = count_stmt.where(Faculty.name.ilike(f"%{request.name}%"))

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return FacultyListResponse(
            total=total, page=request.page, limit=request.limit, faculties=faculties
        )

    async def update_faculty(
        self, session: AsyncSession, faculty_id: int, data: FacultyCreateRequest
    ) -> Faculty:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        result = await session.execute(stmt)
        faculty = result.scalar_one_or_none()

        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found"
            )

        if data.name is not None:
            stmt_check = select(Faculty).where(
                Faculty.name == data.name, Faculty.id != faculty_id
            )
            existing_faculty = (
                await session.execute(stmt_check)
            ).scalar_one_or_none()
            if existing_faculty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Faculty name already taken",
                )
            faculty.name = data.name

        await session.commit()
        await session.refresh(faculty)
        return faculty

    async def delete_faculty(
        self, session: AsyncSession, faculty_id: int
    ) -> None:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        result = await session.execute(stmt)
        faculty = result.scalar_one_or_none()

        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found"
            )

        await session.delete(faculty)
        await session.commit()


get_faculty_repository = FacultyRepository()
