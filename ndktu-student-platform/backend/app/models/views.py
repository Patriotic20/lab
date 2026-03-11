from app.models.permission.view import PermissionView
from app.models.role.view import RoleView
from app.models.role_permission.view import RolePermissionView
from app.models.student.view import StudentView
from app.models.user.view import UserView
from app.models.user_role.view import UserRoleView
from app.models.faculty.view import FacultyView
from app.models.kafedra.view import KafedraView
from app.models.group.view import GroupView
from app.models.teacher.view import TeacherView
from app.models.subject.view import SubjectView
from app.models.question.view import QuestionView
from app.models.quiz.view import QuizView
from app.models.quiz_questions.view import QuizQuestionView
from app.models.subject_teacher.view import SubjectTeacherView
from app.models.results.view import ResultView
from app.models.user_answers.view import UserAnswersView
from app.models.group_teachers.view import GroupTeacherView
from sqladmin import Admin


def register_models(admin: Admin):
    admin.add_view(UserView)
    admin.add_view(RoleView)
    admin.add_view(PermissionView)
    admin.add_view(UserRoleView)
    admin.add_view(RolePermissionView)
    admin.add_view(StudentView)
    admin.add_view(FacultyView)
    admin.add_view(KafedraView)
    admin.add_view(GroupView)
    admin.add_view(TeacherView)
    admin.add_view(SubjectView)
    admin.add_view(QuestionView)
    admin.add_view(QuizView)
    admin.add_view(QuizQuestionView)
    admin.add_view(SubjectTeacherView)
    admin.add_view(ResultView)
    admin.add_view(UserAnswersView)
    admin.add_view(GroupTeacherView)
