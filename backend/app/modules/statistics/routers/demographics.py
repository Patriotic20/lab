from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..filters import StatsFilters, stats_filters
from ..repository import get_statistics_repository
from ..schemas import (
    DemographicResponse,
    GpaCorrelationResponse,
    SemesterProgressionResponse,
)

router = APIRouter(prefix="/demographics", tags=["Statistics — Demographics"])


@router.get("/gender", response_model=DemographicResponse)
async def by_gender(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_stats_by_gender(session=session, filters=filters)


@router.get("/education-form", response_model=DemographicResponse)
async def by_education_form(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_stats_by_education_form(session=session, filters=filters)


@router.get("/education-type", response_model=DemographicResponse)
async def by_education_type(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_stats_by_education_type(session=session, filters=filters)


@router.get("/education-lang", response_model=DemographicResponse)
async def by_education_lang(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_stats_by_education_lang(session=session, filters=filters)


@router.get("/payment-form", response_model=DemographicResponse)
async def by_payment_form(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_stats_by_payment_form(session=session, filters=filters)


@router.get("/gpa-correlation", response_model=GpaCorrelationResponse)
async def gpa_correlation(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_gpa_correlation(session=session, filters=filters)


@router.get("/semester-progression", response_model=SemesterProgressionResponse)
async def semester_progression(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:demographics")),
):
    return await get_statistics_repository.get_semester_progression(session=session, filters=filters)
