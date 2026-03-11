"""
file_utils.py — MIME validation and file size checking.
"""

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import FileTooLargeError, UnsupportedMediaTypeError


async def validate_and_read(file: UploadFile) -> tuple[bytes, str]:
    """
    Validate a video upload and return its bytes + MIME type.

    Raises:
        UnsupportedMediaTypeError: if the MIME type is not in the allowed set.
        FileTooLargeError:         if file exceeds MAX_FILE_SIZE_MB.

    Returns:
        (file_bytes, content_type)
    """
    content_type = file.content_type or ""
    if content_type not in settings.allowed_mime_types:
        raise UnsupportedMediaTypeError(
            f"Received '{content_type}'. "
            f"Allowed: {', '.join(sorted(settings.allowed_mime_types))}"
        )

    file_bytes = await file.read()

    if len(file_bytes) > settings.max_file_size_bytes:
        raise FileTooLargeError(
            f"File size {len(file_bytes) // (1024*1024)} MB "
            f"exceeds limit of {settings.max_file_size_mb} MB"
        )

    return file_bytes, content_type
