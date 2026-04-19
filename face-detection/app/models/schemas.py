from pydantic import BaseModel


class AnalyzeVideoResponse(BaseModel):
    """Response for POST /v1/video/analyze"""

    has_two_faces: bool


class ErrorResponse(BaseModel):
    """Generic error envelope"""

    error: str
