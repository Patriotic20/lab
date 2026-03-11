"""
video_utils.py — OpenCV frame extraction and video metadata helpers.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.core.config import settings
from app.core.exceptions import VideoUnreadableError


def get_video_metadata(video_path: str) -> dict:
    """
    Open a video and return basic metadata.

    Returns:
        dict with keys: total_frames, fps, width, height

    Raises:
        VideoUnreadableError: if the video cannot be opened or has no frames.
    """
    cap = cv2.VideoCapture(video_path)
    try:
        if not cap.isOpened():
            raise VideoUnreadableError()
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0 or total_frames <= 0:
            raise VideoUnreadableError("Video has no readable frames or invalid FPS")
        return {
            "total_frames": total_frames,
            "fps": fps,
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        }
    finally:
        cap.release()


def compute_sample_step(fps: float) -> int:
    """
    Compute the frame index step for uniform temporal sampling.

    Example: fps=30, sample_fps=2  →  step=15 (every 15th frame)
    """
    return max(1, round(fps / settings.sample_fps))


def read_frame_at(cap: cv2.VideoCapture, frame_index: int) -> np.ndarray | None:
    """
    Seek to `frame_index` and decode one frame.

    Returns:
        BGR NumPy array, or None if the frame is unreadable.
    """
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    ok, frame = cap.read()
    if not ok or frame is None:
        return None
    return frame
