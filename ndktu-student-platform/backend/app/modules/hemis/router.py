import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.db_helper import db_helper
from fastapi_limiter.depends import RateLimiter

from .schemas import HemisLoginRequest, HemisLoginResponse
from .service import hemis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hemis", tags=["Hemis"])

@router.post("/login", response_model=HemisLoginResponse, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def hemis_login(
    data: HemisLoginRequest,
    session: AsyncSession = Depends(db_helper.session_getter)
):
    return await hemis_service.hemis_login(session=session, data=data)
