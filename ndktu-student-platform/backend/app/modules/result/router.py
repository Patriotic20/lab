import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_result_repository
from .schemas import (
    ResultResponse,
    ResultListRequest,
    ResultListResponse,
)
from app.models.user.model import User
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Result"],
    prefix="/result",
)


@router.get("/{result_id}", response_model=ResultResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_result(
    result_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:result")),
):
    return await get_result_repository.get_result(
        session=session, result_id=result_id
    )


@router.get("/", response_model=ResultListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_results(
    data: ResultListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:result")),
):
    return await get_result_repository.list_results(
        session=session, request=data, current_user=current_user
    )


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_result(
    result_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:result")),
):
    await get_result_repository.delete_result(
        session=session, result_id=result_id
    )
    # await clear_cache(list_results)
    # await clear_cache(get_result, result_id=result_id)
