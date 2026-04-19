import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from .repository import get_yakuniy_repository
from .schemas import (
    YakuniyCreateRequest,
    YakuniyUpdateRequest,
    YakuniyResponse,
    YakuniyListRequest,
    YakuniyListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Yakuniy"],
    prefix="/yakuniy",
)


@router.post(
    "/",
    response_model=YakuniyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def create_yakuniy(
    data: YakuniyCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:yakuniy")),
):
    return await get_yakuniy_repository.create_yakuniy(session=session, data=data)


@router.get("/", response_model=YakuniyListResponse)
async def list_yakuniy(
    data: YakuniyListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:yakuniy")),
):
    return await get_yakuniy_repository.list_yakuniy(session=session, request=data)


@router.get("/{yakuniy_id}", response_model=YakuniyResponse)
async def get_yakuniy(
    yakuniy_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:yakuniy")),
):
    return await get_yakuniy_repository.get_yakuniy(session=session, yakuniy_id=yakuniy_id)


@router.put(
    "/{yakuniy_id}",
    response_model=YakuniyResponse,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def update_yakuniy(
    yakuniy_id: int,
    data: YakuniyUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:yakuniy")),
):
    return await get_yakuniy_repository.update_yakuniy(
        session=session, yakuniy_id=yakuniy_id, data=data
    )


@router.delete(
    "/{yakuniy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def delete_yakuniy(
    yakuniy_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:yakuniy")),
):
    await get_yakuniy_repository.delete_yakuniy(session=session, yakuniy_id=yakuniy_id)
