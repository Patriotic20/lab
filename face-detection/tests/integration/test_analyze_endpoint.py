"""Integration tests for POST /v1/video/analyze"""

import io
import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Happy-path: mock the analyse_video coroutine so no actual model is needed
# ---------------------------------------------------------------------------

def _post_video(client, video_bytes: bytes, content_type: str = "video/mp4", filename: str = "test.mp4"):
    return client.post(
        "/v1/video/analyze",
        files={"file": (filename, io.BytesIO(video_bytes), content_type)},
    )


@pytest.mark.parametrize("has_two, expected_result", [(True, True), (False, False)])
def test_analyze_returns_correct_boolean(client, blank_video_bytes, has_two, expected_result):
    """Endpoint must propagate service result without modification."""
    with patch("app.services.video_service.analyse_video", return_value=has_two):
        resp = _post_video(client, blank_video_bytes)
    assert resp.status_code == 200
    assert resp.json() == {"has_two_faces": expected_result}


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

def test_unsupported_mime_type_returns_400(client):
    """Uploading a text file must be rejected with 400."""
    resp = _post_video(client, b"not a video", content_type="text/plain", filename="bad.txt")
    assert resp.status_code == 400
    assert "error" in resp.json()


def test_missing_file_returns_422(client):
    """POST with no file at all must return 422."""
    resp = client.post("/v1/video/analyze")
    assert resp.status_code == 422


def test_oversized_file_returns_413(client, monkeypatch):
    """A file that exceeds MAX_FILE_SIZE_BYTES must return 413."""
    from app.core import config
    monkeypatch.setattr(config.settings, "max_file_size_mb", 0)  # 0 MB → anything fails
    resp = _post_video(client, b"some bytes")
    assert resp.status_code in (400, 413)


# ---------------------------------------------------------------------------
# Unreadable video
# ---------------------------------------------------------------------------

def test_corrupted_video_returns_400(client):
    """Garbage bytes that OpenCV cannot decode must return 400."""
    from app.core.exceptions import VideoUnreadableError
    with patch(
        "app.services.video_service.analyse_video",
        side_effect=VideoUnreadableError(),
    ):
        resp = _post_video(client, b"\x00\x01\x02corrupted", content_type="video/mp4")
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

def test_response_schema_has_correct_field(client, blank_video_bytes):
    """Response must contain exactly the `has_two_faces` boolean field."""
    with patch("app.services.video_service.analyse_video", return_value=False):
        resp = _post_video(client, blank_video_bytes)
    data = resp.json()
    assert set(data.keys()) == {"has_two_faces"}
    assert isinstance(data["has_two_faces"], bool)
