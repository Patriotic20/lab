import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_kafedra_repository
from .schemas import (
    KafedraCreateRequest,
    KafedraCreateResponse,
    KafedraListRequest,
    KafedraListResponse,
)
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Kafedra"],
    prefix="/kafedra",
)


@router.post(
    "/", 
    response_model=KafedraCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_kafedra(
    data: KafedraCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:kafedra")),
):
    result = await get_kafedra_repository.create_kafedra(session=session, data=data)
    # await clear_cache(list_kafedras)
    return result


@router.get("/{kafedra_id}", response_model=KafedraCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_kafedra(
    kafedra_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:kafedra")),
):
    return await get_kafedra_repository.get_kafedra(
        session=session, kafedra_id=kafedra_id
    )


@router.get("/", response_model=KafedraListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_kafedras(
    data: KafedraListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:kafedra")),
):
    return await get_kafedra_repository.list_kafedras(
        session=session, request=data
    )


@router.put("/{kafedra_id}", response_model=KafedraCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_kafedra(
    kafedra_id: int,
    data: KafedraCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:kafedra")),
):
    result = await get_kafedra_repository.update_kafedra(
        session=session, kafedra_id=kafedra_id, data=data
    )
    # await clear_cache(list_kafedras)
    # await clear_cache(get_kafedra, kafedra_id=kafedra_id)
    return result


@router.delete("/{kafedra_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_kafedra(
    kafedra_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:kafedra")),
):
    await get_kafedra_repository.delete_kafedra(
        session=session, kafedra_id=kafedra_id
    )
    # await clear_cache(list_kafedras)
    # await clear_cache(get_kafedra, kafedra_id=kafedra_id)
