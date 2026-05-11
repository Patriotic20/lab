from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..filters import StatsFilters, stats_filters
from ..repository import get_statistics_repository
from ..schemas import (
    CheatingByReasonResponse,
    CheatingByScopeResponse,
    CheatingOverviewResponse,
    ProctoringEvidenceResponse,
    RepeatOffendersResponse,
    SuspectQuizzesResponse,
)

router = APIRouter(prefix="/proctoring", tags=["Statistics — Proctoring"])


@router.get("/overview", response_model=CheatingOverviewResponse)
async def cheating_overview(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_cheating_overview(session=session, filters=filters)


@router.get("/by-reason", response_model=CheatingByReasonResponse)
async def cheating_by_reason(
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_cheating_by_reason(session=session, filters=filters)


@router.get("/by-scope", response_model=CheatingByScopeResponse)
async def cheating_by_scope(
    scope: str = Query(..., pattern="^(faculty|group|subject|quiz)$"),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_cheating_by_scope(session=session, filters=filters, scope=scope)


@router.get("/repeat-offenders", response_model=RepeatOffendersResponse)
async def repeat_offenders(
    min_count: int = Query(2, ge=1, le=100),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_repeat_offenders(session=session, filters=filters, min_count=min_count)


@router.get("/suspect-quizzes", response_model=SuspectQuizzesResponse)
async def suspect_quizzes(
    threshold_pct: float = Query(20.0, ge=0.0, le=100.0),
    filters: StatsFilters = Depends(stats_filters),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_suspect_quizzes(
        session=session, filters=filters, threshold_pct=threshold_pct
    )


@router.get("/evidence/{user_id}", response_model=ProctoringEvidenceResponse)
async def proctoring_evidence(
    user_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:proctoring")),
):
    return await get_statistics_repository.get_proctoring_evidence(session=session, user_id=user_id)
