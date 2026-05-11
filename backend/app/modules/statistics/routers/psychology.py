from typing import Optional

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..filters import StatsFilters, stats_filters
from ..repository import get_statistics_repository
from ..schemas import (
    DiagnosisDistributionResponse,
    PsychologyCoverageResponse,
    PsychologyMethodPopularityResponse,
    PsychologyRiskGroupResponse,
    PsychologyVsAcademicResponse,
)

router = APIRouter(prefix="/psychology-stats", tags=["Statistics — Psychology"])


@router.get("/coverage", response_model=PsychologyCoverageResponse)
async def coverage(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:psychology")),
):
    return await get_statistics_repository.get_psychology_coverage(session=session, filters=filters)


@router.get("/popularity", response_model=PsychologyMethodPopularityResponse)
async def popularity(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:psychology")),
):
    return await get_statistics_repository.get_psychology_method_popularity(session=session, filters=filters)


@router.get("/method/{method_id}/diagnosis-distribution", response_model=DiagnosisDistributionResponse)
async def diagnosis_distribution(
    method_id: int,
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:psychology")),
):
    return await get_statistics_repository.get_diagnosis_distribution(
        session=session, method_id=method_id, filters=filters
    )


@router.get("/method/{method_id}/vs-academic", response_model=PsychologyVsAcademicResponse)
async def psychology_vs_academic(
    method_id: int,
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:psychology")),
):
    return await get_statistics_repository.get_psychology_vs_academic(
        session=session, method_id=method_id, filters=filters
    )


@router.get("/method/{method_id}/risk-group", response_model=PsychologyRiskGroupResponse)
async def risk_group(
    method_id: int,
    label_substring: Optional[str] = Query(None, max_length=100),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:psychology")),
):
    return await get_statistics_repository.get_psychology_risk_group(
        session=session, method_id=method_id, label_substring=label_substring
    )
