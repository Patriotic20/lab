import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_permission_repository
from .schemas import (
    PermissionCreateRequest,
    PermissionCreateResponse,
    PermissionListRequest,
    PermissionListResponse,
)
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Permission"],
    prefix="/permission",
)


@router.post(
    "/", 
    response_model=PermissionCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(5, 60))]
)
async def create_permission(
    data: PermissionCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:permission")),
):
    result = await get_permission_repository.create_permission(session=session, data=data)
    # await clear_cache(list_permissions)
    return result


@router.get("/{permission_id}", response_model=PermissionCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_permission(
    permission_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:permission")),
):
    return await get_permission_repository.get_permission(
        session=session, permission_id=permission_id
    )


@router.get("/", response_model=PermissionListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_permissions(
    data: PermissionListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:permission")),
):
    return await get_permission_repository.list_permissions(
        session=session, request=data
    )


@router.put("/{permission_id}", response_model=PermissionCreateResponse, dependencies=[Depends(RateLimiter(5, 60))])
async def update_permission(
    permission_id: int,
    data: PermissionCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:permission")),
):
    result = await get_permission_repository.update_permission(
        session=session, permission_id=permission_id, data=data
    )
    # await clear_cache(list_permissions)
    # await clear_cache(get_permission, permission_id=permission_id)
    return result


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(5, 60))])
async def delete_permission(
    permission_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:permission")),
):
    await get_permission_repository.delete_permission(
        session=session, permission_id=permission_id
    )
    # await clear_cache(list_permissions)
    # await clear_cache(get_permission, permission_id=permission_id)
