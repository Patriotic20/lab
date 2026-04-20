import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from .repository import get_tutor_repository
from .schemas import (
    TutorAssignGroupsRequest,
    TutorCreateRequest,
    TutorListRequest,
    TutorListResponse,
    TutorResponse,
    TutorUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Tutor"],
    prefix="/tutor",
)


@router.post(
    "/",
    response_model=TutorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def create_tutor(
    data: TutorCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:tutor")),
):
    return await get_tutor_repository.create_tutor(session=session, data=data)


@router.get("/", response_model=TutorListResponse)
async def list_tutors(
    data: TutorListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:tutor")),
):
    return await get_tutor_repository.list_tutors(session=session, request=data)


@router.get("/{tutor_id}", response_model=TutorResponse)
async def get_tutor(
    tutor_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:tutor")),
):
    return await get_tutor_repository.get_tutor(session=session, tutor_id=tutor_id)


@router.put(
    "/{tutor_id}",
    response_model=TutorResponse,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def update_tutor(
    tutor_id: int,
    data: TutorUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:tutor")),
):
    return await get_tutor_repository.update_tutor(
        session=session, tutor_id=tutor_id, data=data
    )


@router.delete(
    "/{tutor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def delete_tutor(
    tutor_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:tutor")),
):
    await get_tutor_repository.delete_tutor(session=session, tutor_id=tutor_id)


@router.post(
    "/assign_groups",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def assign_groups(
    data: TutorAssignGroupsRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:tutor")),
):
    await get_tutor_repository.assign_groups(session=session, data=data)
    return {"message": "Groups assigned successfully"}


@router.get("/{tutor_id}/groups", response_model=TutorResponse)
async def get_tutor_groups(
    tutor_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:tutor")),
):
    return await get_tutor_repository.get_groups_by_tutor(
        session=session, tutor_id=tutor_id
    )
