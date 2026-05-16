import logging
import sys

from app.core.config import settings


_NOISY_ACCESS_PATHS: frozenset[str] = frozenset(
    {
        "/docs",
        "/docs/oauth2-redirect",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
        "/health",
    }
)


class _AccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        args = record.args
        if not isinstance(args, tuple) or len(args) < 5:
            return True
        path = args[2]
        status = args[4]
        if not isinstance(path, str) or not isinstance(status, int):
            return True
        if status >= 400:
            return True
        return path.split("?", 1)[0] not in _NOISY_ACCESS_PATHS


def setup_logging() -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    access_logger = logging.getLogger("uvicorn.access")
    for existing in list(access_logger.filters):
        if isinstance(existing, _AccessLogFilter):
            access_logger.removeFilter(existing)
    access_logger.addFilter(_AccessLogFilter())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
