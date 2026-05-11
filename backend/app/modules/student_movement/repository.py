import logging

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.student.model import Student
from app.modules.student_movement.model import StudentMovement
from app.modules.user.models.user import User

from .schemas import (
    StudentMovementCreateRequest,
    StudentMovementListResponse,
    StudentMovementResponse,
    StudentMovementUpdateRequest,
)

logger = logging.getLogger(__name__)


def _default_to_status_for_type(movement_type: str) -> str | None:
    mapping = {
        "enrollment": "active",
        "transfer": "active",
        "return": "active",
        "leave": "on_leave",
        "expulsion": "expelled",
        "graduation": "graduated",
    }
    return mapping.get(movement_type)


class StudentMovementRepository:
    async def _load_student(self, session: AsyncSession, student_id: int) -> Student:
        student = (
            await session.execute(select(Student).where(Student.id == student_id))
        ).scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return student

    async def create_movement(
        self, session: AsyncSession, data: StudentMovementCreateRequest, current_user: User
    ) -> StudentMovementResponse:
        student = await self._load_student(session, data.student_id)

        from_group_id = data.from_group_id if data.from_group_id is not None else student.group_id
        from_status = data.from_status if data.from_status is not None else student.student_status
        to_status = data.to_status or _default_to_status_for_type(data.movement_type)

        movement = StudentMovement(
            student_id=student.id,
            movement_type=data.movement_type,
            from_group_id=from_group_id,
            to_group_id=data.to_group_id,
            from_status=from_status,
            to_status=to_status,
            order_number=data.order_number,
            order_date=data.order_date,
            effective_date=data.effective_date,
            reason=data.reason,
            created_by_user_id=current_user.id,
        )
        session.add(movement)

        # Side effects on Student row
        if data.movement_type in ("enrollment", "transfer", "return") and data.to_group_id is not None:
            student.group_id = data.to_group_id
        if to_status:
            student.student_status = to_status

        # Try to update enrollment_date / graduation_date if Student has these columns (added in this migration)
        if data.movement_type == "enrollment" and hasattr(student, "enrollment_date"):
            student.enrollment_date = data.effective_date
        if data.movement_type == "graduation" and hasattr(student, "graduation_date"):
            student.graduation_date = data.effective_date

        try:
            await session.commit()
            await session.refresh(movement)
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating movement: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}"
            )

        loaded = (
            await session.execute(
                select(StudentMovement)
                .options(selectinload(StudentMovement.from_group), selectinload(StudentMovement.to_group))
                .where(StudentMovement.id == movement.id)
            )
        ).scalar_one()
        return StudentMovementResponse.model_validate(loaded)

    async def list_for_student(self, session: AsyncSession, student_id: int) -> StudentMovementListResponse:
        stmt = (
            select(StudentMovement)
            .options(selectinload(StudentMovement.from_group), selectinload(StudentMovement.to_group))
            .where(StudentMovement.student_id == student_id)
            .order_by(desc(StudentMovement.effective_date), desc(StudentMovement.id))
        )
        items = (await session.execute(stmt)).scalars().all()
        return StudentMovementListResponse(
            movements=[StudentMovementResponse.model_validate(m) for m in items]
        )

    async def update_movement(
        self, session: AsyncSession, movement_id: int, data: StudentMovementUpdateRequest
    ) -> StudentMovementResponse:
        m = (
            await session.execute(select(StudentMovement).where(StudentMovement.id == movement_id))
        ).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movement not found")

        for field in (
            "movement_type",
            "from_group_id",
            "to_group_id",
            "from_status",
            "to_status",
            "order_number",
            "order_date",
            "effective_date",
            "reason",
        ):
            val = getattr(data, field)
            if val is not None:
                setattr(m, field, val)
        await session.commit()

        loaded = (
            await session.execute(
                select(StudentMovement)
                .options(selectinload(StudentMovement.from_group), selectinload(StudentMovement.to_group))
                .where(StudentMovement.id == movement_id)
            )
        ).scalar_one()
        return StudentMovementResponse.model_validate(loaded)

    async def delete_movement(self, session: AsyncSession, movement_id: int) -> None:
        m = (
            await session.execute(select(StudentMovement).where(StudentMovement.id == movement_id))
        ).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movement not found")
        await session.delete(m)
        await session.commit()


get_student_movement_repository = StudentMovementRepository()
