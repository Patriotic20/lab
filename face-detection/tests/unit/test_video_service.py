"""Unit tests for the video analysis service logic."""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock


@pytest.mark.parametrize(
    "face_counts, expected",
    [
        ([0, 0, 0], False),           # no faces at all
        ([1, 1, 1], False),           # only one face
        ([3, 3, 3], False),           # always 3+
        ([2, 0, 0], True),            # two faces on first sampled frame
        ([0, 2, 0], True),            # two faces on middle frame
        ([0, 0, 2], True),            # two faces on last frame
        ([1, 3, 2], True),            # mix — eventually hits 2
        ([1, 3, 4], False),           # mix — never exactly 2
    ],
)
def test_analyse_sync_business_logic(face_counts, expected, tmp_path, monkeypatch):
    """
    Core algorithm: _analyse_sync must return True iff any sampled frame
    contains exactly 2 faces.  We mock VideoCapture and count_faces.
    """
    import cv2
    import numpy as np
    from app.services.video_service import _analyse_sync

    # Build a fake VideoCapture that returns `len(face_counts)` readable frames.
    dummy_frame = np.zeros((240, 320, 3), dtype=np.uint8)
    cap_mock = MagicMock()
    cap_mock.isOpened.return_value = True
    cap_mock.get.side_effect = lambda prop: {
        cv2.CAP_PROP_FRAME_COUNT: float(len(face_counts)),
        cv2.CAP_PROP_FPS: 1.0,   # 1 FPS → step=1 → every frame sampled
    }.get(prop, 0.0)

    # Each call to cap.read() returns the next frame.
    read_results = [(True, dummy_frame)] * len(face_counts) + [(False, None)]
    cap_mock.read.side_effect = read_results

    # Patch VideoCapture and count_faces.
    with (
        patch("app.services.video_service.cv2.VideoCapture", return_value=cap_mock),
        patch("app.services.video_service.get_detector") as mock_get_det,
    ):
        detector_mock = MagicMock()
        detector_mock.count_faces.side_effect = face_counts
        mock_get_det.return_value = detector_mock

        result = _analyse_sync("/fake/path.mp4")

    assert result == expected


def test_analyse_sync_raises_on_unreadable_video():
    """Raise VideoUnreadableError when VideoCapture.isOpened() is False."""
    from app.services.video_service import _analyse_sync
    from app.core.exceptions import VideoUnreadableError

    with patch("app.services.video_service.cv2.VideoCapture") as mock_cap_cls:
        cap = MagicMock()
        cap.isOpened.return_value = False
        mock_cap_cls.return_value = cap

        with pytest.raises(VideoUnreadableError):
            _analyse_sync("/fake/path.mp4")
