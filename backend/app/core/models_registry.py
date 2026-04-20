"""
Import all models here so SQLAlchemy's Base.metadata is fully populated.
Used by Alembic env.py and anywhere that needs all tables registered.
"""

__all__ = [
    "User",
    "Role",
    "UserRole",
    "RolePermission",
    "Permission",
    "Student",
    "Faculty",
    "Kafedra",
    "Group",
    "Teacher",
    "Subject",
    "SubjectTeacher",
    "Question",
    "Quiz",
    "QuizQuestion",
    "Result",
    "UserAnswers",
    "GroupTeacher",
    "Yakuniy",
    "HemisTransaction",
    "Resource",
    "PsychologyMethod",
    "Tutor",
    "TutorGroup",
]

from app.modules.permission.model import Permission
from app.modules.role.models.role import Role
from app.modules.role.models.role_permission import RolePermission
from app.modules.student.model import Student
from app.modules.user.models.user import User
from app.modules.user.models.user_role import UserRole

from app.modules.faculty.model import Faculty
from app.modules.kafedra.model import Kafedra
from app.modules.group.models.group import Group
from app.modules.group.models.group_teachers import GroupTeacher
from app.modules.teacher.model import Teacher
from app.modules.subject.models.subject import Subject
from app.modules.subject.models.subject_teacher import SubjectTeacher
from app.modules.question.model import Question
from app.modules.quiz.models.quiz import Quiz
from app.modules.quiz.models.quiz_questions import QuizQuestion
from app.modules.result.model import Result
from app.modules.user_answers.model import UserAnswers
from app.modules.yakuniy.model import Yakuniy
from app.modules.hemis.model import HemisTransaction
from app.modules.resource.model import Resource
from app.modules.psychology.model import PsychologyMethod, PsychologyQuestion, PsychologyResult
from app.modules.tutor.models.tutor import Tutor
from app.modules.tutor.models.tutor_groups import TutorGroup
