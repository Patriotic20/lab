from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..filters import StatsFilters, stats_filters
from ..repository import get_statistics_repository
from ..schemas import (
    GradeDistributionResponse,
    GradeTrendResponse,
    PassRateResponse,
    QuizDifficultyResponse,
    QuizTimeStatsResponse,
)

router = APIRouter(prefix="/quiz-analytics", tags=["Statistics — Quiz analytics"])


@router.get("/grade-distribution", response_model=GradeDistributionResponse)
async def grade_distribution(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_grade_distribution(session=session, filters=filters)


@router.get("/pass-rate", response_model=PassRateResponse)
async def pass_rate(
    threshold: int = Query(60, ge=0, le=100),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_pass_rate(session=session, filters=filters, threshold=threshold)


@router.get("/grade-trend", response_model=GradeTrendResponse)
async def grade_trend(
    granularity: str = Query("day", pattern="^(day|week|month)$"),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_grade_trend(session=session, filters=filters, granularity=granularity)


@router.get("/difficulty-ranking", response_model=QuizDifficultyResponse)
async def difficulty_ranking(
    order: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int = Query(20, ge=1, le=200),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_quiz_difficulty_ranking(
        session=session, filters=filters, limit=limit, order=order
    )


@router.get("/time-stats", response_model=QuizTimeStatsResponse)
async def time_stats(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_quiz_time_stats(session=session, filters=filters)
