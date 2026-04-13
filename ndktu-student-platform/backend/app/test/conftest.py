import pytest_asyncio
from core.config import settings
from core.db_helper import db_helper
from httpx import ASGITransport, AsyncClient
import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from main import app
from app.models.base import Base
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool



@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_test_services():
    """
    Инициализация всех внешних сервисов (Limiter + Cache).
    """
    test_redis = redis.from_url(
        "redis://localhost:6379", 
        encoding="utf-8", 
        decode_responses=True
    )
    
    # 1. Инициализируем Limiter
    await FastAPILimiter.init(test_redis)
    
    # 2. Инициализируем Cache (исправляет ошибку 'You must call init first!')
    FastAPICache.init(RedisBackend(test_redis), prefix="fastapi-cache")
    
    yield
    
    await test_redis.aclose() # Используем aclose() вместо close() для новых версий

@pytest_asyncio.fixture(scope="function", autouse=True)
async def clear_test_redis():
    """
    Очистка Redis перед каждым тестом, чтобы избежать ошибки 429 (Rate Limit).
    """
    test_redis = redis.from_url("redis://localhost:6379")
    await test_redis.flushdb() # Полностью очищаем базу перед тестом
    await test_redis.aclose()
    yield

async_engine = create_async_engine(
    url=str(settings.database.test_url),
    echo=False,
    poolclass=NullPool,
)


@pytest_asyncio.fixture(scope="function")
async def async_db_engine():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield async_engine

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def async_db(async_db_engine):
    async_session = async_sessionmaker(
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
        bind=async_db_engine,
        class_=AsyncSession,
    )

    async with async_session() as session:
        await session.begin()

        yield session

        await session.rollback()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def async_client(async_db):
    def override_get_db():
        yield async_db

    app.dependency_overrides[db_helper.session_getter] = override_get_db
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost")


@pytest_asyncio.fixture
async def test_role(async_db):
    from app.models.role.model import Role

    role = Role(name="Admin")
    async_db.add(role)
    await async_db.commit()
    await async_db.refresh(role)
    return role


@pytest_asyncio.fixture
async def test_user(async_client, test_role):
    payload = {
        "username": "test_user",
        "password": "password123",
        "roles": [{"name": "Admin"}],
    }

    response = await async_client.post("/user/", json=payload)
    assert response.status_code == 201
    data = response.json()
    data["password"] = payload["password"]
    return data


@pytest_asyncio.fixture
async def access_token(async_client, test_user):
    response = await async_client.post(
        "/user/login",
        json={
            "username": test_user["username"],
            "password": test_user["password"],
        },
    )

    assert response.status_code == 200
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def auth_client(async_client, access_token):
    async_client.headers.update(
        {
            "Authorization": access_token,
        }
    )
    return async_client


@pytest_asyncio.fixture
async def create_permission(async_client, access_token):
    payload = {"name": "read:book"}

    response = await async_client.post("/permission/", json=payload)

    assert response.status_code == 201


@pytest_asyncio.fixture
async def test_subject(async_db):
    """Create a subject directly in DB since there is no API for it"""
    from app.models.subject.model import Subject
    subject = Subject(name="Mathematics")
    async_db.add(subject)
    await async_db.commit()
    await async_db.refresh(subject)
    return subject


@pytest_asyncio.fixture
async def test_faculty(auth_client):
    payload = {"name": "IT Faculty"}
    response = await auth_client.post("/faculty/", json=payload)
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture
async def test_kafedra(auth_client, test_faculty):
    payload = {
        "name": "Software Engineering",
        "faculty_id": test_faculty["id"]
    }
    response = await auth_client.post("/kafedra/", json=payload)
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture
async def test_group(auth_client, test_faculty):
    payload = {
        "name": "SE-2023",
        "faculty_id": test_faculty["id"]
    }
    response = await auth_client.post("/group/", json=payload)
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture
async def test_teacher(auth_client, test_kafedra):
    user_payload = {
        "username": "teacher_fixture_user",
        "password": "password123",
        "roles": [{"name": "Admin"}]
    }
    user_response = await auth_client.post("/user/", json=user_payload)
    assert user_response.status_code == 201
    user_data = user_response.json()

    payload = {
        "first_name": "John",
        "last_name": "Doe",
        "third_name": "Smith",
        "kafedra_id": test_kafedra["id"],
        "user_id": user_data["id"]
    }
    response = await auth_client.post("/teacher/", json=payload)
    assert response.status_code == 201
    return response.json()
