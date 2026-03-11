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
]


from .permission.model import Permission
from .role.model import Role
from .role_permission.model import RolePermission
from .student.model import Student
from .user.model import User
from .user_role.model import UserRole


from .faculty.model import Faculty
from .kafedra.model import Kafedra
from .group.model import Group
from .teacher.model import Teacher
from .subject.model import Subject
from .subject_teacher.model import SubjectTeacher
from .question.model import Question
from .quiz.model import Quiz
from .quiz_questions.model import QuizQuestion
from .results.model import Result
from .user_answers.model import UserAnswers
from .group_teachers.model import GroupTeacher