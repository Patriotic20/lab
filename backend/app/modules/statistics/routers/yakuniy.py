from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..filters import StatsFilters, stats_filters
from ..repository import get_statistics_repository
from ..schemas import (
    YakuniyBySubjectResponse,
    YakuniyDistributionResponse,
    YakuniyVsQuizResponse,
)

router = APIRouter(prefix="/yakuniy", tags=["Statistics — Yakuniy"])


@router.get("/distribution", response_model=YakuniyDistributionResponse)
async def yakuniy_distribution(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_final_grade_distribution(session=session, filters=filters)


@router.get("/by-subject", response_model=YakuniyBySubjectResponse)
async def yakuniy_by_subject(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_yakuniy_by_subject(session=session, filters=filters)


@router.get("/vs-quiz", response_model=YakuniyVsQuizResponse)
async def yakuniy_vs_quiz(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics")),
):
    return await get_statistics_repository.get_yakuniy_vs_quiz_correlation(session=session, filters=filters)
