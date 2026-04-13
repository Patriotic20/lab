import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from .repository import get_resource_repository
from .schemas import (
    ResourceCreateRequest,
    ResourceUpdateRequest,
    ResourceResponse,
    ResourceListRequest,
    ResourceListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Resource"],
    prefix="/resource",
)


@router.post(
    "/",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def create_resource(
    data: ResourceCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:resource")),
):
    return await get_resource_repository.create_resource(session=session, data=data)


@router.get("/", response_model=ResourceListResponse)
async def list_resources(
    data: ResourceListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:resource")),
):
    return await get_resource_repository.list_resources(session=session, request=data)


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:resource")),
):
    return await get_resource_repository.get_resource(session=session, resource_id=resource_id)


@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def update_resource(
    resource_id: int,
    data: ResourceUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:resource")),
):
    return await get_resource_repository.update_resource(
        session=session, resource_id=resource_id, data=data
    )


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def delete_resource(
    resource_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:resource")),
):
    await get_resource_repository.delete_resource(session=session, resource_id=resource_id)
