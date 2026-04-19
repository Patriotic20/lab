from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from app.modules.user.models.user import User

from .service import get_psychology_service
from .schemas import (
    MethodCreateRequest,
    MethodUpdateRequest,
    MethodResponse,
    MethodListRequest,
    MethodListResponse,
    QuestionCreateRequest,
    QuestionUpdateRequest,
    QuestionResponse,
    TestSubmitRequest,
    TestResultResponse,
    TestResultListRequest,
    TestResultListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/psychology",
    tags=["Psychology"],
)

# ─── Method endpoints ────────────────────────────────────────────────────────

@router.post(
    "/method/",
    response_model=MethodResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def create_method(
    data: MethodCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:psychology")),
):
    return await get_psychology_service.create_method(session=session, data=data)


@router.get("/method/", response_model=MethodListResponse)
async def list_methods(
    request: MethodListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:psychology")),
):
    return await get_psychology_service.list_methods(session=session, request=request)


@router.get("/method/{method_id}", response_model=MethodResponse)
async def get_method(
    method_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:psychology")),
):
    return await get_psychology_service.get_method(session=session, method_id=method_id)


@router.put(
    "/method/{method_id}",
    response_model=MethodResponse,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def update_method(
    method_id: int,
    data: MethodUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:psychology")),
):
    return await get_psychology_service.update_method(session=session, method_id=method_id, data=data)


@router.delete(
    "/method/{method_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def delete_method(
    method_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:psychology")),
):
    await get_psychology_service.delete_method(session=session, method_id=method_id)


# ─── Question endpoints ───────────────────────────────────────────────────────

@router.post(
    "/question/",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def create_question(
    data: QuestionCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:psychology")),
):
    return await get_psychology_service.create_question(session=session, data=data)


@router.get("/question/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:psychology")),
):
    return await get_psychology_service.get_question(session=session, question_id=question_id)


@router.put(
    "/question/{question_id}",
    response_model=QuestionResponse,
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def update_question(
    question_id: int,
    data: QuestionUpdateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:psychology")),
):
    return await get_psychology_service.update_question(
        session=session, question_id=question_id, data=data
    )


@router.delete(
    "/question/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def delete_question(
    question_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:psychology")),
):
    await get_psychology_service.delete_question(session=session, question_id=question_id)


# ─── Test / Result endpoints ──────────────────────────────────────────────────

@router.post(
    "/test/{method_id}/submit",
    response_model=TestResultResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def submit_test(
    method_id: int,
    data: TestSubmitRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:psychology")),
):
    return await get_psychology_service.submit_test(
        session=session, method_id=method_id, user_id=current_user.id, data=data
    )


@router.get("/test/results/", response_model=TestResultListResponse)
async def list_results(
    request: TestResultListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:psychology")),
):
    is_admin = any(r.name == "Admin" for r in (current_user.roles or []))
    user_filter = None if is_admin else current_user.id
    return await get_psychology_service.list_results(
        session=session, request=request, user_id=user_filter
    )


@router.get("/test/results/{result_id}", response_model=TestResultResponse)
async def get_result(
    result_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: User = Depends(PermissionRequired("read:psychology")),
):
    return await get_psychology_service.get_result(session=session, result_id=result_id)
