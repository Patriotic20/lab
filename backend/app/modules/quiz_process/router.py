import logging

from core.db_helper import db_helper
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from dependence.role_checker import PermissionRequired
from app.models.user.model import User
from fastapi_limiter.depends import RateLimiter

from .repository import get_quiz_process_repository
from .schemas import (
    StartQuizRequest,
    StartQuizResponse,
    EndQuizRequest,
    EndQuizResponse,
)
# from app.core.cache import clear_cache
from app.modules.result.router import list_results

# Note: Permissions might be needed but usually taking a quiz is open to students?
# For now, keeping it open or simple. If auth is needed, Dependencies can be added.

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Quiz Process"],
    prefix="/quiz_process",
)


@router.post(
    "/start_quiz", 
    response_model=StartQuizResponse, 
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def start_quiz(
    data: StartQuizRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("quiz_process:start_quiz")),
):
    return await get_quiz_process_repository.start_quiz(session=session, data=data, user=current_user)


@router.post(
    "/end_quiz", 
    response_model=EndQuizResponse, 
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def end_quiz(
    data: EndQuizRequest,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_user: User = Depends(PermissionRequired("quiz_process:end_quiz")),
):
    return await get_quiz_process_repository.end_quiz(session=session, data=data, user=current_user)
