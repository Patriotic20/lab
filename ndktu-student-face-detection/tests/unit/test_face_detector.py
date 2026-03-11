"""Unit tests for FaceDetector wrapper."""

import numpy as np
import pytest
from unittest.mock import MagicMock, patch


def _make_detections(count: int):
    """Build a mock MediaPipe result with `count` detections."""
    result = MagicMock()
    result.detections = [MagicMock() for _ in range(count)]
    return result


@pytest.mark.parametrize("face_count", [0, 1, 2, 3])
def test_count_faces_returns_correct_count(face_count):
    """FaceDetector.count_faces() must return the exact number of detections."""
    with (
        patch("app.services.face_detector.vision.FaceDetector.create_from_options") as mock_create,
        patch("app.services.face_detector.mp_python.BaseOptions"),
        patch("app.services.face_detector.vision.FaceDetectorOptions"),
    ):
        mock_detector = MagicMock()
        mock_detector.detect.return_value = _make_detections(face_count)
        mock_create.return_value = mock_detector

        from app.services.face_detector import FaceDetector
        detector = FaceDetector()

        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        count = detector.count_faces(frame)

        assert count == face_count
