"""
VideoService — orchestrates the full video analysis pipeline:
  upload → temp file → frame sampling → face detection → business decision
"""

import asyncio
import os
import tempfile
from pathlib import Path

import cv2

from app.core.config import settings
from app.core.exceptions import VideoUnreadableError
from app.core.logging import get_logger
from app.services.face_detector import FaceDetector

logger = get_logger(__name__)

# Singleton detector — created once, reused across all requests.
_detector: FaceDetector | None = None


def get_detector() -> FaceDetector:
    global _detector
    if _detector is None:
        _detector = FaceDetector()
    return _detector


# ---------------------------------------------------------------------------
# Sync core logic (runs inside thread-pool via asyncio.run_in_executor)
# ---------------------------------------------------------------------------

def _analyse_sync(video_path: str) -> bool:
    """
    Synchronous implementation of the two-face detection algorithm.

    Returns:
        True  — if at least one sampled frame contains EXACTLY 2 faces.
        False — in all other cases.
    """
    detector = get_detector()
    cap = cv2.VideoCapture(video_path)

    try:
        if not cap.isOpened():
            raise VideoUnreadableError()

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        if fps <= 0 or total_frames <= 0:
            raise VideoUnreadableError("Video has no readable frames or invalid FPS")

        step = max(1, round(fps / settings.sample_fps))
        logger.info(
            "Analysing video: total_frames=%d fps=%.2f step=%d",
            total_frames, fps, step,
        )

        frame_index = 0
        while frame_index < total_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = cap.read()

            if not ok or frame is None:
                # Corrupted segment — skip, do not abort the entire video.
                logger.debug("Skipping unreadable frame at index %d", frame_index)
                frame_index += step
                continue

            face_count = detector.count_faces(frame)
            logger.debug("Frame %d → %d face(s)", frame_index, face_count)

            if face_count == 2:
                logger.info("Two faces found at frame %d — early exit.", frame_index)
                return True

            frame_index += step

    finally:
        cap.release()

    logger.info("Analysis complete — no frame with exactly 2 faces found.")
    return False


# ---------------------------------------------------------------------------
# Async public interface
# ---------------------------------------------------------------------------

async def analyse_video(file_bytes: bytes, content_type: str) -> bool:
    """
    Write the uploaded bytes to a temp file and run detection off the event loop.

    Args:
        file_bytes:   Raw video bytes from the upload.
        content_type: MIME type (informational, already validated upstream).

    Returns:
        True if any frame contains exactly 2 simultaneous faces, False otherwise.
    """
    suffix = _mime_to_extension(content_type)
    tmp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _analyse_sync, tmp_path)
        return result

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _mime_to_extension(content_type: str) -> str:
    mapping = {
        "video/mp4": ".mp4",
        "video/avi": ".avi",
        "video/quicktime": ".mov",
        "video/x-matroska": ".mkv",
        "video/webm": ".webm",
    }
    return mapping.get(content_type, ".mp4")
