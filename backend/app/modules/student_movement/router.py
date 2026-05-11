from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from .repository import get_student_movement_repository
from .schemas import (
    StudentMovementCreateRequest,
    StudentMovementListResponse,
    StudentMovementResponse,
    StudentMovementUpdateRequest,
)

if TYPE_CHECKING:
    from app.modules.user.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["StudentMovement"], prefix="/student-movement")


@router.post(
    "/",
    response_model=StudentMovementResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def create_movement(
    data: StudentMovementCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: "User" = Depends(PermissionRequired("create:student_movement")),
):
    return await get_student_movement_repository.create_movement(
        session=session, data=data, current_user=current_user
    )


@router.get("/student/{student_id}", response_model=StudentMovementListResponse)
async def list_for_student(
    student_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("read:student_movement")),
):
    return await get_student_movement_repository.list_for_student(session=session, student_id=student_id)


@router.put("/{movement_id}", response_model=StudentMovementResponse)
async def update_movement(
    movement_id: int,
    data: StudentMovementUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("update:student_movement")),
):
    return await get_student_movement_repository.update_movement(
        session=session, movement_id=movement_id, data=data
    )


@router.delete("/{movement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movement(
    movement_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("delete:student_movement")),
):
    await get_student_movement_repository.delete_movement(session=session, movement_id=movement_id)
