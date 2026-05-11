from .demographics import router as demographics_router
from .item_analysis import router as item_analysis_router
from .organizational import router as organizational_router
from .proctoring import router as proctoring_router
from .psychology import router as psychology_router
from .quiz_analytics import router as quiz_analytics_router
from .teacher_activity import router as teacher_activity_router
from .yakuniy import router as yakuniy_router

__all__ = [
    "demographics_router",
    "item_analysis_router",
    "organizational_router",
    "proctoring_router",
    "psychology_router",
    "quiz_analytics_router",
    "teacher_activity_router",
    "yakuniy_router",
]
