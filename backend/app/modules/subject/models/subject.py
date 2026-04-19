from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.teacher.model import Teacher
    from app.modules.question.model import Question
    from app.modules.quiz.models.quiz import Quiz
    from app.modules.subject.models.subject_teacher import SubjectTeacher
    from app.modules.result.model import Result
    from app.modules.yakuniy.model import Yakuniy


class Subject(Base, IdIntPk, TimestampMixin):
    __tablename__ = "subjects"

    name: Mapped[str] = mapped_column(String(250), unique=True)

    subject_teachers: Mapped[list["SubjectTeacher"]] = relationship(
        "SubjectTeacher",
        back_populates="subject",
    )

    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="subject"
    )

    quizzes: Mapped[list["Quiz"]] = relationship(
        "Quiz",
        back_populates="subject"
    )

    results: Mapped[list["Result"]] = relationship(
        "Result",
        back_populates="subject"
    )

    yakuniy_results: Mapped[list["Yakuniy"]] = relationship(
        "Yakuniy",
        back_populates="subject"
    )

    def __str__(self):
        return self.name
