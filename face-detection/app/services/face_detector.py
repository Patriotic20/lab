import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
import face_recognition

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class FaceDetector:
    """Face detector (MediaPipe) and identity verifier (face_recognition)."""

    def __init__(self) -> None:
        base_options = mp_python.BaseOptions(
            model_asset_path=settings.model_path,
        )
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=settings.min_detection_confidence,
        )
        self._detector = vision.FaceDetector.create_from_options(options)
        logger.info("FaceDetector initialised with MediaPipe and face_recognition")

    def count_faces(self, bgr_frame: np.ndarray) -> int:
        """Count the number of detected faces using MediaPipe (fast)."""
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._detector.detect(mp_image)
        return len(result.detections)

    def get_face_encoding(self, bgr_frame: np.ndarray):
        """
        Get the face encoding for the first face found in the frame.
        Used to 'lock' the user at the start of the quiz.
        """
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_frame)
        if encodings:
            return encodings[0]
        return None

    def compare_faces(self, reference_encoding, current_encoding, tolerance=0.5) -> bool:
        """
        Compare current face encoding with the reference encoding.
        Returns True if they match.
        """
        if reference_encoding is None or current_encoding is None:
            return False
        
        matches = face_recognition.compare_faces([reference_encoding], current_encoding, tolerance=tolerance)
        return matches[0] if matches else False
