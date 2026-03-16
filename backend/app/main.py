
import uvicorn
import app.core.logging  # Trigger logging/logfire configuration
from app.core.config import settings
from app.core.db_helper import db_helper
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.admin_auth import AdminAuth
from app.middleware.logging_middleware import LoggingMiddleware
from app.models.views import register_models
from app.modules.router import router
from sqladmin import Admin
import logfire

from fastapi.staticfiles import StaticFiles
import os
from app.lifespan.lifespan import lifespan

app = FastAPI(lifespan=lifespan)

# --- Logfire Instrumentation ---
logfire.instrument_fastapi(app)

authentication_backend = AdminAuth(secret_key=settings.admin.secret_key)

# Ensure upload directory exists
os.makedirs(settings.file_url.upload_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://test.api.nsumt.uz"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# --- Register Logging Middleware ---
app.add_middleware(LoggingMiddleware)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class ForceHTTPSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.scope["scheme"] = "https"
        return await call_next(request)

app.add_middleware(ForceHTTPSMiddleware)

app.include_router(router)
admin = Admin(
    app, engine=db_helper.engine, authentication_backend=authentication_backend
)
register_models(admin)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


def main():
    uvicorn.run(
        app=settings.server.app_path,
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.reload,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()
