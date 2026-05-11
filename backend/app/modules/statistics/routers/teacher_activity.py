from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..repository import get_statistics_repository
from ..schemas import (
    TeacherActivityResponse,
    TeacherProctoringResponse,
    TeacherQuestionQualityResponse,
)

router = APIRouter(prefix="/teacher-activity", tags=["Statistics — Teacher activity"])


@router.get("/{teacher_id}/question-quality", response_model=TeacherQuestionQualityResponse)
async def teacher_question_quality(
    teacher_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_teacher_question_quality(session=session, teacher_id=teacher_id)


@router.get("/{teacher_id}/timeline", response_model=TeacherActivityResponse)
async def teacher_activity_timeline(
    teacher_id: int,
    granularity: str = Query("month", pattern="^(day|week|month)$"),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_teacher_activity_timeline(
        session=session, teacher_id=teacher_id, granularity=granularity
    )


@router.get("/{teacher_id}/proctoring", response_model=TeacherProctoringResponse)
async def teacher_proctoring(
    teacher_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_teacher_proctoring_summary(session=session, teacher_id=teacher_id)
