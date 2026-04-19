from contextlib import asynccontextmanager
from fastapi import FastAPI
from redis import asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_limiter import FastAPILimiter
from core.config import settings
from core.db_helper import db_helper
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis = aioredis.from_url(
        settings.redis.url,
        encoding="utf8",
        decode_responses=True
    )

    try:
        # Verify connection
        await redis.ping()
        logger.info("Successfully connected to Redis")

        # Initialize Database Data (Roles & Permissions)
        async with db_helper.session_factory() as session:
            from core.init_db import init_db
            await init_db(app, session)

        FastAPICache.init(RedisBackend(redis), prefix=settings.redis.prefix)
        await FastAPILimiter.init(redis)
        logger.info("Initialized FastAPICache and FastAPILimiter")

    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        # We might want to re-raise if Redis is critical, 
        # or just log it if the app can function without cache.
        # Given the user request, it seems critical.
        raise e

    yield

    # Shutdown
    await redis.close()
    logger.info("Closed Redis connection")
