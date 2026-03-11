"""Unit tests for video_utils helpers."""

import cv2
import numpy as np
import pytest

from app.core.exceptions import VideoUnreadableError
from app.utils.video_utils import compute_sample_step, get_video_metadata


def test_compute_sample_step_normal():
    """30 FPS, sample at 2 FPS → step = 15."""
    assert compute_sample_step(30.0) == 15


def test_compute_sample_step_low_fps():
    """1 FPS source → step is never less than 1."""
    assert compute_sample_step(1.0) == 1


def test_compute_sample_step_high_sample_fps(monkeypatch):
    """If sample_fps >= video fps, step should be 1."""
    from app.core import config
    monkeypatch.setattr(config.settings, "sample_fps", 60)
    assert compute_sample_step(24.0) == 1


def test_get_video_metadata_invalid_path():
    """Non-existent path must raise VideoUnreadableError."""
    with pytest.raises(VideoUnreadableError):
        get_video_metadata("/tmp/__nonexistent_file__.mp4")


def test_get_video_metadata_valid(blank_video_path):
    """Valid MP4 returns expected metadata keys."""
    meta = get_video_metadata(blank_video_path)
    assert "total_frames" in meta
    assert "fps" in meta
    assert meta["fps"] > 0
    assert meta["total_frames"] > 0
