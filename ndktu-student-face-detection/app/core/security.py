"""Internal-service authentication for the face-detection API.

The face service is not intended for public use — the main backend is the only
caller. Every endpoint requires the shared secret from ``Settings.internal_service_token``
sent as ``X-Internal-Token`` (HTTP) or the ``token`` query parameter (WebSocket,
since browsers cannot set arbitrary WS headers).
"""

from __future__ import annotations

import secrets

from fastapi import Header, HTTPException, WebSocket, status

from app.core.config import settings


def verify_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    """FastAPI dependency for HTTP endpoints."""
    expected = settings.internal_service_token
    if not x_internal_token or not secrets.compare_digest(x_internal_token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or missing internal token")


async def verify_ws_token(websocket: WebSocket, token: str | None) -> bool:
    """Validate a WebSocket connection's token before accepting it.

    Returns True if valid; otherwise closes the socket with 1008 and returns False.
    Callers must short-circuit on False.
    """
    expected = settings.internal_service_token
    if not token or not secrets.compare_digest(token, expected):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return False
    return True
