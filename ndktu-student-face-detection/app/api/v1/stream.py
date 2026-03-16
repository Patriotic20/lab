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

    reference_encoding = None
    last_recognition_time = 0
    import time

    try:
        while True:
            # 1. Receive base64 JPEG frame from browser
            data: str = await websocket.receive_text()

            # Strip the data-URL header if present
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

            # 3. Detect and Compare faces
            face_count = detector.count_faces(frame)
            is_different_person = False
            current_time = time.time()

            # Recognition logic: Frequent counting but infrequent identity check
            if face_count == 1:
                # 1. Check if we need to capture or verify identity (every 5 seconds)
                if reference_encoding is None or (current_time - last_recognition_time >= 5.0):
                    current_encoding = detector.get_face_encoding(frame)
                    
                    if reference_encoding is None and current_encoding is not None:
                        # Capture the FIRST face as the owner
                        reference_encoding = current_encoding
                        last_recognition_time = current_time
                        logger.info("Reference face captured for session.")
                    elif reference_encoding is not None and current_encoding is not None:
                        # Periodic identity verification
                        is_match = detector.compare_faces(reference_encoding, current_encoding)
                        last_recognition_time = current_time
                        if not is_match:
                            is_different_person = True
                            logger.warning("Different person detected!")

            # 4. Reply
            await websocket.send_json({
                "has_two_faces": face_count > 1,
                "face_count": face_count,
                "is_different_person": is_different_person,
                "is_reference_captured": reference_encoding is not None
            })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)
