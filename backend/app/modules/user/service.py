import logging
from datetime import datetime, timedelta, timezone

import jwt
from core.config import settings
from core.utils.password_hash import verify_password
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.role.models.role import Role
from app.modules.student.model import Student
from app.modules.teacher.model import Teacher
from app.modules.user.models.user import User

from .schemas import UserLoginRequest, UserLoginResponse

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    def _strip_bearer(header_value: str) -> str:
        """Extract the raw JWT token from an ``Authorization`` header.

        Accepts only ``Bearer <token>`` (RFC 6750). Raises 401 on anything else
        — previously a missing prefix caused IndexError → 500 Internal Server
        Error, which broke the frontend's refresh flow.
        """
        if not header_value:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
            )
        parts = header_value.strip().split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header (expected 'Bearer <token>')",
            )
        return parts[1].strip()

    async def login(self, session: AsyncSession, data: UserLoginRequest) -> UserLoginResponse:
        user = await self.get_user_by_username(session, data.username)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username")

        if not verify_password(data.password, user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

        access_token = self.create_access_token({"user_id": user.id})
        refresh_token = self.create_refresh_token({"user_id": user.id})

        return UserLoginResponse(type="Bearer", access_token=access_token, refresh_token=refresh_token)

    async def refresh(self, session: AsyncSession, refresh_token: str) -> UserLoginResponse:
        token = self._strip_bearer(refresh_token)
        payload = self.token_decode(token, secret_key=settings.jwt.refresh_token_secret)

        # Reject access-tokens accidentally posted to /refresh. ``None`` is
        # tolerated for backwards-compat with tokens issued before this fix.
        token_type = payload.get("type")
        if token_type is not None and token_type != "refresh":
            logger.warning(f"Refresh rejected: wrong token type ({token_type!r})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Wrong token type (expected refresh)",
            )

        user = await self.get_user_by_id(session, payload["user_id"])

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        access_token = self.create_access_token({"user_id": user.id})
        refresh_token = self.create_refresh_token({"user_id": user.id})
        logger.info(f"Token refreshed for user_id={user.id}")

        return UserLoginResponse(type="Bearer", access_token=access_token, refresh_token=refresh_token)

    async def get_current_user(self, session: AsyncSession, token: str) -> User:
        token = self._strip_bearer(token)
        payload = self.token_decode(token)
        stmt = (
            select(User)
            .where(User.id == payload["user_id"])
            .options(
                selectinload(User.roles).selectinload(Role.permissions),
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

    def token_decode(self, token: str, secret_key: str | None = None) -> dict:
        try:
            return jwt.decode(
                token,
                secret_key or settings.jwt.access_token_secret,
                algorithms=[settings.jwt.algorithm],
            )
        except jwt.ExpiredSignatureError:
            logger.info("Token decode: expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token decode: invalid ({e.__class__.__name__})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

    def _create_token(self, data: dict, secret_key: str, expires_delta: timedelta):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=settings.jwt.algorithm)
        return encoded_jwt

    def create_access_token(self, data: dict):
        payload = {**data, "type": "access"}
        delta = timedelta(minutes=settings.jwt.access_token_expires_minutes)
        return self._create_token(data=payload, secret_key=settings.jwt.access_token_secret, expires_delta=delta)

    def create_refresh_token(self, data: dict):
        payload = {**data, "type": "refresh"}
        delta = timedelta(days=settings.jwt.refresh_token_expires_days)
        return self._create_token(data=payload, secret_key=settings.jwt.refresh_token_secret, expires_delta=delta)

    async def get_user_by_id(self, session: AsyncSession, user_id: int):
        stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_username(self, session: AsyncSession, username: str):
        stmt = select(User).where(User.username == username).options(selectinload(User.roles))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


auth_service = UserService()
