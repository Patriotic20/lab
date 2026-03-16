import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_group_repository
from .schemas import (
    GroupCreateRequest,
    GroupCreateResponse,
    GroupListRequest,
    GroupListResponse,
)
from app.modules.student.repository import student_repository
from app.modules.student.schemas import StudentListResponse, StudentListRequest
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Group"],
    prefix="/group",
)


@router.post(
    "/", 
    response_model=GroupCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_group(
    data: GroupCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:group")),
):
    result = await get_group_repository.create_group(session=session, data=data)
    # await clear_cache(list_groups)
    return result


@router.get("/{group_id}", response_model=GroupCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_group(
    group_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:group")),
):
    return await get_group_repository.get_group(
        session=session, group_id=group_id
    )


@router.get("/", response_model=GroupListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_groups(
    data: GroupListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:group")),
):
    return await get_group_repository.list_groups(
        session=session, request=data
    )


@router.get("/{group_id}/students", response_model=StudentListResponse)
async def get_group_students(
    group_id: int,
    page: int = 1,
    limit: int = 100,
    search: str | None = None,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:student")),
):
    """Return all students belonging to the specified group."""
    request = StudentListRequest(page=page, limit=limit, search=search, group_id=group_id)
    return await student_repository.list_students(session=session, request=request)


@router.put("/{group_id}", response_model=GroupCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_group(
    group_id: int,
    data: GroupCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:group")),
):
    result = await get_group_repository.update_group(
        session=session, group_id=group_id, data=data
    )
    # await clear_cache(list_groups)
    # await clear_cache(get_group, group_id=group_id)
    return result


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_group(
    group_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:group")),
):
    await get_group_repository.delete_group(
        session=session, group_id=group_id
    )
    # await clear_cache(list_groups)
    # await clear_cache(get_group, group_id=group_id)
