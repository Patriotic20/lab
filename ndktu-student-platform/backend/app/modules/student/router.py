import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache

from .repository import student_repository
from .schemas import (
    StudentCreateRequest,
    StudentListRequest,
    StudentListResponse,
    StudentResponse,
    StudentUpdateRequest,
)
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/students", tags=["Students"])


# @router.post(
#     "/", 
#     response_model=StudentResponse, 
#     status_code=status.HTTP_201_CREATED,
#     dependencies=[Depends(RateLimiter(times=5, seconds=60))]
# )
# async def create_student(
#     data: StudentCreateRequest, 
#     session: AsyncSession = Depends(db_helper.session_getter),
#     _: PermissionRequired = Depends(PermissionRequired("create:student")),
# ):
#     return await student_repository.create_student(session, data)


@router.get("/{student_id}", response_model=StudentResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_student(
    student_id: int, 
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:student")),
):
    return await student_repository.get_student(session, student_id)


@router.get("/", response_model=StudentListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_students(
    data: StudentListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:student")),
):
    return await student_repository.list_students(session=session, request=data)


@router.put("/{student_id}", response_model=StudentResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_student(
    student_id: int,
    data: StudentUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:student")),
):
    result = await student_repository.update_student(session, student_id, data)
    # await clear_cache(list_students)
    # await clear_cache(get_student, student_id=student_id)
    return result


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_student(
    student_id: int, 
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:student")),
):
    await student_repository.delete_student(session, student_id)
    # await clear_cache(list_students)
    # await clear_cache(get_student, student_id=student_id)
