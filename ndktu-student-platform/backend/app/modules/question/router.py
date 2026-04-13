import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
# from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from .repository import get_question_repository
from .schemas import (
    QuestionCreateRequest,
    QuestionCreateResponse,
    QuestionListRequest,
    QuestionListResponse,
    QuestionBulkDeleteRequest,
)
from app.models.user.model import User

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Question"],
    prefix="/question",
)


@router.get("/download_excel")
async def download_questions_excel(
    subject_id: int | None = Query(None),
    user_id: int | None = Query(None),
    text: str | None = Query(None),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:question")),
):
    import io

    excel_bytes = await get_question_repository.download_questions_excel(
        session=session,
        subject_id=subject_id,
        user_id=user_id,
        text=text,
    )
    
    filename = "savollar.xlsx"
    if subject_id:
        filename = f"savollar_fan_{subject_id}.xlsx"
    
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.post(
    "/", 
    response_model=QuestionCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def create_question(
    data: QuestionCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("create:question")),
):
    result = await get_question_repository.create_question(session=session, data=data)
    # await clear_cache(list_questions)
    return result


@router.get("/{question_id}", response_model=QuestionCreateResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def get_question(
    question_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:question")),
):
    return await get_question_repository.get_question(
        session=session, question_id=question_id, current_user=current_user
    )


@router.get("/", response_model=QuestionListResponse)
# @cache(expire=60, key_builder=custom_key_builder)
async def list_questions(
    data: QuestionListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("read:question")),
):
    return await get_question_repository.list_questions(
        session=session, request=data, current_user=current_user
    )


@router.put("/{question_id}", response_model=QuestionCreateResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def update_question(
    question_id: int,
    data: QuestionCreateRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("update:question")),
):
    result = await get_question_repository.update_question(
        session=session, question_id=question_id, data=data, current_user=current_user
    )
    # await clear_cache(list_questions)
    # await clear_cache(get_question, question_id=question_id)
    return result


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_question(
    question_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("delete:question")),
):
    await get_question_repository.delete_question(
        session=session, question_id=question_id, current_user=current_user
    )
    # await clear_cache(list_questions)
    # await clear_cache(get_question, question_id=question_id)


@router.delete("/bulk/subject-user", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def bulk_delete_questions(
    data: QuestionBulkDeleteRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("delete:question")),
):
    return await get_question_repository.bulk_delete_questions(
        session=session, data=data, current_user=current_user
    )
    return {"deleted_count": count}


@router.post("/upload_image", status_code=status.HTTP_200_OK, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def upload_image(
    file: UploadFile = File(...),
    _: PermissionRequired = Depends(PermissionRequired("create:question")),
):
    url = await get_question_repository.upload_image(file=file)
    return {"url": url}


@router.post("/upload_excel", status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def upload_questions_excel(
    subject_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: PermissionRequired = Depends(PermissionRequired("create:question")),
):
    result = await get_question_repository.upload_questions_excel(
        session=session, file=file, subject_id=subject_id, user_id=current_user.id
    )
    # await clear_cache(list_questions)
    return result
