import logging

from datetime import datetime, timedelta, timezone

import jwt
from core.config import settings
from core.utils.password_hash import verify_password
from fastapi import HTTPException, status
from app.models.user.model import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.teacher.model import Teacher
from app.models.student.model import Student

from .schemas import UserLoginRequest, UserLoginResponse

logger = logging.getLogger(__name__)


class UserService:
    async def login(
        self, session: AsyncSession, data: UserLoginRequest
    ) -> UserLoginResponse:
        user = await self.get_user_by_username(session, data.username)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username"
            )

        if not verify_password(data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password"
            )

        access_token = self.create_access_token({"user_id": user.id})
        refresh_token = self.create_refresh_token({"user_id": user.id})

        return UserLoginResponse(
            type="Bearer", access_token=access_token, refresh_token=refresh_token
        )

    async def refresh(
        self, session: AsyncSession, refresh_token: str
    ) -> UserLoginResponse:
        token = refresh_token.split(" ")[1]
        payload = self.token_decode(token)
        user = await self.get_user_by_id(session, payload["user_id"])

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        access_token = self.create_access_token({"user_id": user.id})
        refresh_token = self.create_refresh_token({"user_id": user.id})

        return UserLoginResponse(
            type="Bearer", access_token=access_token, refresh_token=refresh_token
        )

    async def get_current_user(self, session: AsyncSession, token: str) -> User:
        token = token.split(" ")[1]
        payload = self.token_decode(token)
        stmt = (
            select(User)
            .where(User.id == payload["user_id"])
            .options(
                selectinload(User.roles),
                selectinload(User.teacher).selectinload(Teacher.kafedra),
                selectinload(User.student).selectinload(Student.group),
            )
        )
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        return user

    def token_decode(self, token: str) -> dict:
        payload = jwt.decode(
            token, settings.jwt.access_token_secret, algorithms=[settings.jwt.algorithm]
        )
        return payload

    def _create_token(self, data: dict, secret_key: str, expires_delta: timedelta):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, secret_key, algorithm=settings.jwt.algorithm
        )
        return encoded_jwt

    def create_access_token(self, data: dict):
        delta = timedelta(minutes=settings.jwt.access_token_expires_minutes)
        return self._create_token(
            data=data, secret_key=settings.jwt.access_token_secret, expires_delta=delta
        )

    def create_refresh_token(self, data: dict):
        delta = timedelta(days=settings.jwt.refresh_token_expires_days)
        return self._create_token(
            data=data, secret_key=settings.jwt.refresh_token_secret, expires_delta=delta
        )

    async def get_user_by_id(self, session: AsyncSession, user_id: int):
        stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_username(self, session: AsyncSession, username: str):
        stmt = (
            select(User)
            .where(User.username == username)
            .options(selectinload(User.roles))
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


auth_service = UserService()