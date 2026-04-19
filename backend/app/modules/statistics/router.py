import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache

from .repository import get_statistics_repository
from .schemas import (
    GeneralStatisticsResponse,
    QuizStatisticsResponse,
    UserStatisticsResponse,
    FacultyStatisticsResponse,
    GroupStatisticsResponse,
    TeacherStatisticsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Statistics"],
    prefix="/statistics",
)


@router.get("/general", response_model=GeneralStatisticsResponse)
# @cache(expire=60)
async def get_general_statistics(
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_general_stats(session=session)


@router.get("/quiz/{quiz_id}", response_model=QuizStatisticsResponse)
# @cache(expire=60)
async def get_quiz_statistics(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_quiz_stats(
        session=session, quiz_id=quiz_id
    )


@router.get("/user/{user_id}", response_model=UserStatisticsResponse)
# @cache(expire=60)
async def get_user_statistics(
    user_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_user_stats(
        session=session, user_id=user_id
    )


@router.get("/faculty/{faculty_id}", response_model=FacultyStatisticsResponse)
async def get_faculty_statistics(
    faculty_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_faculty_stats(
        session=session, faculty_id=faculty_id
    )


@router.get("/group/{group_id}", response_model=GroupStatisticsResponse)
async def get_group_statistics(
    group_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_group_stats(
        session=session, group_id=group_id
    )


@router.get("/teacher/{teacher_id}", response_model=TeacherStatisticsResponse)
async def get_teacher_statistics(
    teacher_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_teacher_stats(
        session=session, teacher_id=teacher_id
    )
