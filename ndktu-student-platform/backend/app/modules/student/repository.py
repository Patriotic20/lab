import logging

from fastapi import HTTPException, status
from app.models.student.model import Student
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .schemas import (
    StudentCreateRequest,
    StudentListRequest,
    StudentListResponse,
    StudentUpdateRequest,
)

logger = logging.getLogger(__name__)


class StudentRepository:
    async def create_student(
        self, session: AsyncSession, data: StudentCreateRequest
    ) -> Student:
        stmt = select(Student).where(Student.student_id_number == data.student_id_number)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this ID number already exists",
            )

        new_student = Student(**data.model_dump())
        session.add(new_student)
        await session.commit()
        await session.refresh(new_student)
        return new_student

    async def get_student(self, session: AsyncSession, student_id: int) -> Student:
        stmt = (
            select(Student)
            .where(Student.id == student_id)
            .options(selectinload(Student.user), selectinload(Student.group))
        )
        result = await session.execute(stmt)
        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
            )

        return student

    async def list_students(
        self, session: AsyncSession, request: StudentListRequest
    ) -> StudentListResponse:
        stmt = (
            select(Student)
            .options(selectinload(Student.user), selectinload(Student.group))
            .offset(request.offset)
            .limit(request.limit)
        )

        if request.search:
            stmt = stmt.where(
                (Student.first_name.ilike(f"%{request.search}%"))
                | (Student.last_name.ilike(f"%{request.search}%"))
                | (Student.student_id_number.ilike(f"%{request.search}%"))
            )

        if request.user_id is not None:
            stmt = stmt.where(Student.user_id == request.user_id)
        
        if request.group_id is not None:
            stmt = stmt.where(Student.group_id == request.group_id)

        result = await session.execute(stmt)
        students = result.scalars().all()

        count_stmt = select(func.count()).select_from(Student)
        if request.search:
            count_stmt = count_stmt.where(
                (Student.first_name.ilike(f"%{request.search}%"))
                | (Student.last_name.ilike(f"%{request.search}%"))
                | (Student.student_id_number.ilike(f"%{request.search}%"))
            )

        if request.user_id is not None:
            count_stmt = count_stmt.where(Student.user_id == request.user_id)
        
        if request.group_id is not None:
            count_stmt = count_stmt.where(Student.group_id == request.group_id)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return StudentListResponse(
            total=total,
            page=request.page,
            limit=request.limit,
            students=students,
        )

    async def update_student(
        self, session: AsyncSession, student_id: int, data: StudentUpdateRequest
    ) -> Student:
        student = await self.get_student(session, student_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(student, key, value)

        await session.commit()
        await session.refresh(student)
        return student

    async def delete_student(self, session: AsyncSession, student_id: int) -> None:
        student = await self.get_student(session, student_id)
        await session.delete(student)
        await session.commit()


student_repository = StudentRepository()
