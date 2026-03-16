import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_quiz_repository
from .schemas import (
    QuizCreateRequest,
    QuizCreateResponse,
    QuizListRequest,
    QuizListResponse,
)
from app.models.user.model import User
# from app.core.cache import clear_cache, custom_key_builder

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Quiz"],
    prefix="/quiz",
)


@router.post(
    "/", 
    response_model=QuizCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_quiz(
    data: QuizCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:quiz")),
):
    result = await get_quiz_repository.create_quiz(session=session, data=data)
    # await clear_cache(list_quizzes)
    return result


@router.get("/{quiz_id}", response_model=QuizCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:quiz")),
):
    return await get_quiz_repository.get_quiz(
        session=session, quiz_id=quiz_id
    )


@router.get("/", response_model=QuizListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_quizzes(
    data: QuizListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:quiz")),
):
    return await get_quiz_repository.list_quizzes(
        session=session, request=data, current_user=current_user
    )


@router.put("/{quiz_id}", response_model=QuizCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_quiz(
    quiz_id: int,
    data: QuizCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("update:quiz")),
):
    result = await get_quiz_repository.update_quiz(
        session=session, quiz_id=quiz_id, data=data
    )
    # await clear_cache(list_quizzes)
    # await clear_cache(get_quiz, quiz_id=quiz_id)
    return result


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("delete:quiz")),
):
    await get_quiz_repository.delete_quiz(
        session=session, quiz_id=quiz_id
    )
    # await clear_cache(list_quizzes)
    # await clear_cache(get_quiz, quiz_id=quiz_id)

@router.post("/{quiz_id}/repeat", response_model=QuizCreateResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def repeat_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:quiz")),
):
    result = await get_quiz_repository.repeat_quiz(session=session, quiz_id=quiz_id)
    return result


@router.post("/upload", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def upload_image(
    file: UploadFile = File(...),
    _: PermissionRequired = Depends(PermissionRequired("create:quiz")),
):
    url = await get_quiz_repository.upload_image(file=file)
    return {"url": url}
