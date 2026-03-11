"""
app/main.py — FastAPI application factory.

Start with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import router
from app.core.exceptions import AppError
from app.core.logging import get_logger, setup_logging
from app.services import video_service


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup: pre-load the face detector model so first request isn't slow."""
    setup_logging()
    logger = get_logger(__name__)
    logger.info("Loading face detector model…")
    video_service.get_detector()   # warm-up — blocks briefly here, not per-request
    logger.info("Face detector ready. Server is up.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Two-Face Video Detection API",
    description=(
        "Upload a video file. Receive `has_two_faces: true` if any frame "
        "simultaneously contains exactly two human faces."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )


@app.exception_handler(Exception)
async def generic_error_handler(_: Request, exc: Exception) -> JSONResponse:
    get_logger(__name__).exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)