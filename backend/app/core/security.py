from datetime import datetime, timedelta, timezone

import jwt

from core.config import settings


def create_face_ws_token(user_id: int, quiz_id: int, ttl_minutes: int) -> str:
    """Issue a short-lived JWT for the face-detection WebSocket.

    Signed with the shared INTERNAL_SERVICE_TOKEN so the face-detection
    service can verify the token without calling back to the main backend.
    """
    payload = {
        "sub": str(user_id),
        "quiz_id": quiz_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes),
    }
    return jwt.encode(
        payload,
        settings.face_service.internal_token,
        algorithm=settings.jwt.algorithm,
    )
