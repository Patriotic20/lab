"""
WebSocket endpoint for real-time frame-by-frame face detection.

ws://host/v1/video/stream

- Client sends : base64-encoded JPEG string (e.g. canvas.toDataURL('image/jpeg', 0.6))
- Server sends : { "has_two_faces": bool, "face_count": int }
"""

import base64

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.logging import get_logger
from app.services.video_service import get_detector

router = APIRouter()
logger = get_logger(__name__)


@router.websocket("/stream")
async def realtime_stream(websocket: WebSocket) -> None:
    """
    Real-time face detection over WebSocket.

    The browser captures webcam frames and sends them as base64 JPEG strings.
    For every frame the server replies with the detection result.
    """
    await websocket.accept()
    detector = get_detector()
    logger.info("WebSocket client connected: %s", websocket.client)

    try:
        while True:
            # 1. Receive base64 JPEG frame from browser
            data: str = await websocket.receive_text()

            # Strip the data-URL header if present: "data:image/jpeg;base64,..."
            if "," in data:
                _, data = data.split(",", 1)

            # 2. Decode to OpenCV frame
            try:
                nparr = np.frombuffer(base64.b64decode(data), np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception:
                await websocket.send_json({"error": "invalid frame", "has_two_faces": False, "face_count": 0})
                continue

            if frame is None:
                await websocket.send_json({"error": "invalid frame", "has_two_faces": False, "face_count": 0})
                continue

            # 3. Detect faces (runs sync — fast enough at ~10 FPS on CPU)
            face_count = detector.count_faces(frame)

            # 4. Reply
            await websocket.send_json({
                "has_two_faces": face_count > 1,
                "face_count": face_count,
            })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)
