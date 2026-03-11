from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.role.model import Role
    from app.models.student.model import Student
    from app.models.question.model import Question
    from app.models.quiz.model import Quiz
    from app.models.results.model import Result
    from app.models.teacher.model import Teacher
    from app.models.user_answers.model import UserAnswers
    from app.models.group_teachers.model import GroupTeacher


class User(Base, IdIntPk, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True)
    password: Mapped[str] = mapped_column(String(255))

    roles: Mapped[list["Role"]] = relationship(
        "Role", secondary="user_roles", back_populates="users", overlaps="user_roles"
    )

    student: Mapped["Student"] = relationship("Student", back_populates="user")

    questions: Mapped[list["Question"]] = relationship(
        "Question", 
        back_populates="user"
    )

    quizzes: Mapped[list["Quiz"]] = relationship(
        "Quiz", 
        back_populates="user"
    )

    results: Mapped[list["Result"]] = relationship(
        "Result", 
        back_populates="user"
    )


    user_answers: Mapped[list["UserAnswers"]] = relationship(
        "UserAnswers", 
        back_populates="user"
    )

    teacher: Mapped["Teacher"] = relationship("Teacher", back_populates="user")

    group_teachers: Mapped[list["GroupTeacher"]] = relationship(
        "GroupTeacher", 
        back_populates="teacher",
        cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.username
