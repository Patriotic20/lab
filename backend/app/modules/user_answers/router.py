import logging

from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .repository import user_answers_repository
from .schemas import UserAnswersListRequest

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/user_answers",
    tags=["User Answers"],
)


@router.get("/")
async def get_user_answers(
    data: UserAnswersListRequest = Depends(),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("user_answers:read")),
):
    return await user_answers_repository.get_all(session, data)
