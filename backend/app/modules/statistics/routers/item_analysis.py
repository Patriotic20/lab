from core.db_helper import db_helper
from dependence.role_checker import PermissionRequired
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..repository import get_statistics_repository
from ..schemas import (
    FlaggedQuestionsResponse,
    QuestionDifficultyResponse,
    QuestionDiscriminationResponse,
    TopDistractorsResponse,
)

router = APIRouter(prefix="/item-analysis", tags=["Statistics — Item analysis"])


@router.get("/quiz/{quiz_id}/difficulty", response_model=QuestionDifficultyResponse)
async def question_difficulty(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:items")),
):
    return await get_statistics_repository.get_question_difficulty(session=session, quiz_id=quiz_id)


@router.get("/quiz/{quiz_id}/discrimination", response_model=QuestionDiscriminationResponse)
async def question_discrimination(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:items")),
):
    return await get_statistics_repository.get_question_discrimination(session=session, quiz_id=quiz_id)


@router.get("/question/{question_id}/distractors", response_model=TopDistractorsResponse)
async def top_distractors(
    question_id: int,
    limit: int = Query(5, ge=1, le=20),
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:items")),
):
    return await get_statistics_repository.get_top_distractors(
        session=session, question_id=question_id, limit=limit
    )


@router.get("/quiz/{quiz_id}/flagged", response_model=FlaggedQuestionsResponse)
async def flagged_questions(
    quiz_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    _: PermissionRequired = Depends(PermissionRequired("read:statistics:items")),
):
    return await get_statistics_repository.get_flagged_questions(session=session, quiz_id=quiz_id)
