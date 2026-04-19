import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.db_helper import db_helper
from fastapi_limiter.depends import RateLimiter
from starlette.requests import Request

from app.dependence.role_checker import PermissionRequired, get_current_user_id
from .schemas import (
    HemisLoginRequest,
    HemisLoginResponse,
    HemisTransactionResponse,
    HemisTransactionListResponse,
    HemisPreviewResponse,
    HemisSyncResponse,
)
from .service import hemis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hemis", tags=["Hemis"])


# ------------------------------------------------------------------ #
#  LOGIN
# ------------------------------------------------------------------ #
@router.post(
    "/login",
    response_model=HemisLoginResponse,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def hemis_login(
    data: HemisLoginRequest,
    request: Request,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.hemis_login(session=session, data=data, request=request)


# ------------------------------------------------------------------ #
#  ADMIN SYNC & PREVIEW
# ------------------------------------------------------------------ #
@router.post(
    "/preview",
    response_model=HemisPreviewResponse,
    dependencies=[Depends(PermissionRequired("hemis_admin_preview"))],
)
async def preview_hemis_data(
    data: HemisLoginRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.preview_hemis_data(session=session, data=data)


@router.post(
    "/sync",
    response_model=HemisSyncResponse,
    dependencies=[Depends(PermissionRequired("hemis_admin_sync"))],
)
async def sync_hemis_data(
    data: HemisLoginRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.sync_hemis_data(session=session, data=data)

# ------------------------------------------------------------------ #
#  TRANSACTIONS — Admin
# ------------------------------------------------------------------ #
@router.get(
    "/transactions",
    response_model=HemisTransactionListResponse,
    dependencies=[Depends(PermissionRequired("hemis_transactions_view"))],
)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    login: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    login_type: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.get_transactions(
        session=session,
        page=page,
        page_size=page_size,
        login=login,
        status_filter=status_filter,
        login_type=login_type,
    )


@router.get(
    "/transactions/my",
    response_model=HemisTransactionListResponse,
)
async def get_my_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.get_my_transactions(
        session=session,
        user_id=user_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/transactions/{transaction_id}",
    response_model=HemisTransactionResponse,
    dependencies=[Depends(PermissionRequired("hemis_transactions_view"))],
)
async def get_transaction_by_id(
    transaction_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await hemis_service.get_transaction_by_id(
        session=session, transaction_id=transaction_id
    )
