import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_teacher_repository
from .schemas import (
    TeacherCreateRequest,
    TeacherCreateResponse,
    TeacherListRequest,
    TeacherListResponse,
    TeacherGroupAssignRequest,
    TeacherSubjectAssignRequest,
    TeacherAssignedSubjectsResponse,
    TeacherAssignedGroupsResponse,
    TeacherRankingResponse,
    FacultyRankingResponse,
    KafedraRankingResponse,
)
from app.models.user.model import User
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Teacher"],
    prefix="/teacher",
)


@router.post(
    "/", 
    response_model=TeacherCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_teacher(
    data: TeacherCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:teacher")),
):
    result = await get_teacher_repository.create_teacher(session=session, data=data)
    # await clear_cache(list_teachers)
    return result


@router.get("/{teacher_id}", response_model=TeacherCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_teacher(
    teacher_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:teacher")),
):
    return await get_teacher_repository.get_teacher(
        session=session, teacher_id=teacher_id
    )


@router.get("/", response_model=TeacherListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_teachers(
    data: TeacherListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:teacher")),
):
    return await get_teacher_repository.list_teachers(
        session=session, request=data
    )


@router.put("/{teacher_id}", response_model=TeacherCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_teacher(
    teacher_id: int,
    data: TeacherCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:teacher")),
):
    result = await get_teacher_repository.update_teacher(
        session=session, teacher_id=teacher_id, data=data
    )
    # await clear_cache(list_teachers)
    # await clear_cache(get_teacher, teacher_id=teacher_id)
    return result


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_teacher(
    teacher_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:teacher")),
):
    await get_teacher_repository.delete_teacher(
        session=session, teacher_id=teacher_id
    )
    # await clear_cache(list_teachers)
    # await clear_cache(get_teacher, teacher_id=teacher_id)

@router.post("/assign_groups", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def assign_groups(
    data: TeacherGroupAssignRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:teacher")),
):
    await get_teacher_repository.assign_groups(session=session, data=data)
    return {"message": "Groups assigned successfully"}

@router.post("/assign_subjects", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def assign_subjects(
    data: TeacherSubjectAssignRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:teacher")),
):
    await get_teacher_repository.assign_subjects(session=session, data=data)
    return {"message": "Subjects assigned successfully"}

@router.get("/assigned_subjects/by-user/{user_id}", response_model=TeacherAssignedSubjectsResponse)
async def get_teacher_assigned_subjects(
    user_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:teacher")),
):
    return await get_teacher_repository.get_assigned_subjects_by_user(
        session=session, user_id=user_id
    )


@router.get("/assigned_groups/by-user/{user_id}", response_model=TeacherAssignedGroupsResponse)
async def get_teacher_assigned_groups(
    user_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:teacher")),
):
    return await get_teacher_repository.get_assigned_groups_by_user(
        session=session, user_id=user_id
    )



@router.get(
    "/ranking/overall",
    response_model=TeacherRankingResponse,
    summary="Teacher ranking — with optional filters",
)
async def teacher_ranking_overall(
    faculty_id: int | None = None,
    kafedra_id: int | None = None,
    group_id: int | None = None,
    page: int = 1,
    limit: int = 10,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:teacher")),
):
    """
    Return teachers ranked by Bayesian weighted avg student grade.
    All query params are optional — omit all to get full university ranking.
        ?faculty_id=1  → teachers of that faculty only
        ?kafedra_id=3  → teachers of that kafedra only
        ?group_id=7    → teachers assigned to that group only
        ?page=1&limit=10 → pagination
    Any combination of filters can be used together.
    """
    return await get_teacher_repository.get_ranking(
        session=session,
        faculty_id=faculty_id,
        kafedra_id=kafedra_id,
        group_id=group_id,
        page=page,
        limit=limit,
    )


@router.get(
    "/ranking/faculty",
    response_model=FacultyRankingResponse,
    summary="Faculty ranking — faculties ranked by avg student grade",
)
async def faculty_ranking(
    page: int = 1,
    limit: int = 10,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:teacher")),
):
    """Return all faculties ranked by avg student grade (Bayesian weighted)."""
    return await get_teacher_repository.get_faculty_ranking(session=session, page=page, limit=limit)


@router.get(
    "/ranking/kafedra",
    response_model=KafedraRankingResponse,
    summary="Kafedra ranking — chairs ranked by avg student grade",
)
async def kafedra_ranking(
    page: int = 1,
    limit: int = 10,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:teacher")),
):
    """Return all kafedras (chairs) ranked by avg student grade (Bayesian weighted)."""
    return await get_teacher_repository.get_kafedra_ranking(session=session, page=page, limit=limit)
