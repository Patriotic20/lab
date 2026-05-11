from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from .repository import get_sinf_repository
from .schemas import (
    SinfCreateRequest,
    SinfListRequest,
    SinfListResponse,
    SinfResponse,
    SinfUpdateRequest,
)

if TYPE_CHECKING:
    from app.modules.user.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Sinf"],
    prefix="/sinf",
)


def _is_admin(user: "User") -> bool:
    return any(r.name.lower() == "admin" for r in (user.roles or []))


@router.post(
    "/",
    response_model=SinfResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def create_sinf(
    data: SinfCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("create:sinf")),
):
    return await get_sinf_repository.create_sinf(session=session, data=data)


@router.get("/", response_model=SinfListResponse)
async def list_sinfs(
    data: SinfListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: "User" = Depends(PermissionRequired("read:sinf")),
):
    restrict = not _is_admin(current_user)
    return await get_sinf_repository.list_sinfs(
        session=session,
        request=data,
        current_user=current_user,
        restrict_to_teacher=restrict,
    )


@router.get("/{sinf_id}", response_model=SinfResponse)
async def get_sinf(
    sinf_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("read:sinf")),
):
    return await get_sinf_repository.get_sinf(session=session, sinf_id=sinf_id)


@router.put(
    "/{sinf_id}",
    response_model=SinfResponse,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def update_sinf(
    sinf_id: int,
    data: SinfUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("update:sinf")),
):
    return await get_sinf_repository.update_sinf(session=session, sinf_id=sinf_id, data=data)


@router.delete(
    "/{sinf_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def delete_sinf(
    sinf_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: "User" = Depends(PermissionRequired("delete:sinf")),
):
    await get_sinf_repository.delete_sinf(session=session, sinf_id=sinf_id)
