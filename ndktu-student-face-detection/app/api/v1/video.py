"""
POST /v1/video/analyze — detects whether a video contains a frame
with exactly two simultaneous human faces.
"""

from fastapi import APIRouter, File, UploadFile

from app.core.exceptions import NoFileProvidedError
from app.core.logging import get_logger
from app.models.schemas import AnalyzeVideoResponse
from app.services import video_service
from app.utils.file_utils import validate_and_read

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/analyze",
    response_model=AnalyzeVideoResponse,
    summary="Detect whether a video contains exactly two simultaneous faces",
    responses={
        400: {"description": "Unsupported format or unreadable video"},
        413: {"description": "File too large"},
        422: {"description": "No file provided"},
    },
)
async def analyze_video(
    file: UploadFile = File(..., description="Video file (mp4, avi, mov, mkv, webm)"),
) -> AnalyzeVideoResponse:
    """
    Upload a video file.  Returns `has_two_faces: true` if at least one
    sampled frame contains **exactly two** detected faces simultaneously;
    `false` otherwise.
    """
    if file is None or file.filename == "":
        raise NoFileProvidedError()

    logger.info("Received upload: filename=%s content_type=%s", file.filename, file.content_type)

    file_bytes, content_type = await validate_and_read(file)

    has_two = await video_service.analyse_video(file_bytes, content_type)

    logger.info("Result for %s: has_two_faces=%s", file.filename, has_two)
    return AnalyzeVideoResponse(has_two_faces=has_two)
