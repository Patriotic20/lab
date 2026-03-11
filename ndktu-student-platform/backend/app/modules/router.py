from fastapi import APIRouter

from .permission.router import router as permission_router
from .role.router import router as role_router
from .user.router import router as user_router
from .faculty.router import router as faculty_router
from .kafedra.router import router as kafedra_router
from .group.router import router as group_router
from .teacher.router import router as teacher_router
from .question.router import router as question_router
from .quiz.router import router as quiz_router
from .quiz_process.router import router as quiz_process_router
from .result.router import router as result_router
from .statistics.router import router as statistics_router
from .hemis.router import router as hemis_router
from .user_answers.router import router as user_answers_router
from .subject.router import router as subject_router
from .student.router import router as student_router

router = APIRouter()

router.include_router(user_router)
router.include_router(role_router)
router.include_router(permission_router)
router.include_router(faculty_router)
router.include_router(kafedra_router)
router.include_router(group_router)
router.include_router(teacher_router)
router.include_router(question_router)
router.include_router(quiz_router)
router.include_router(quiz_process_router)
router.include_router(result_router)
router.include_router(statistics_router)
router.include_router(hemis_router)
router.include_router(user_answers_router)
router.include_router(subject_router)
router.include_router(student_router)
