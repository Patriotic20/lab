import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_subject_repository
from .schemas import (

    SubjectCreateRequest,
    SubjectCreateResponse,
    SubjectListRequest,
    SubjectListResponse,
)
from app.models.user.model import User
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Subject"],
    prefix="/subject",
)


@router.post(
    "/", 
    response_model=SubjectCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_subject(
    data: SubjectCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:subject")),
):
    result = await get_subject_repository.create_subject(session=session, data=data)
    # await clear_cache(list_subjects)
    return result


@router.get("/{subject_id}", response_model=SubjectCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_subject(
    subject_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:subject")),
):
    return await get_subject_repository.get_subject(
        session=session, subject_id=subject_id
    )


@router.get("/", response_model=SubjectListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_subjects(
    data: SubjectListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:subject")),
):
    return await get_subject_repository.list_subjects(
        session=session, request=data, current_user=current_user
    )


@router.put("/{subject_id}", response_model=SubjectCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_subject(
    subject_id: int,
    data: SubjectCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:subject")),
):
    result = await get_subject_repository.update_subject(
        session=session, subject_id=subject_id, data=data
    )
    # await clear_cache(list_subjects)
    # await clear_cache(get_subject, subject_id=subject_id)
    return result


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_subject(
    subject_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:subject")),
):
    await get_subject_repository.delete_subject(
        session=session, subject_id=subject_id
    )
    # await clear_cache(list_subjects)
    # await clear_cache(get_subject, subject_id=subject_id)
