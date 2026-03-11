"""
FaceDetector — thin wrapper around MediaPipe Tasks Face Detection API.

Loaded once at application startup and reused across all requests.
"""

import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class FaceDetector:
    """Stateless (after init) face detector built on MediaPipe Tasks API."""

    def __init__(self) -> None:
        base_options = mp_python.BaseOptions(
            model_asset_path=settings.model_path,
        )
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=settings.min_detection_confidence,
        )
        self._detector = vision.FaceDetector.create_from_options(options)
        logger.info("FaceDetector initialised (model=%s)", settings.model_path)

    def count_faces(self, bgr_frame: np.ndarray) -> int:
        """
        Count the number of detected faces in a single BGR OpenCV frame.

        Args:
            bgr_frame: HxWx3 NumPy array in BGR colour order.

        Returns:
            Number of faces detected (0 or more).
        """
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._detector.detect(mp_image)
        return len(result.detections)
