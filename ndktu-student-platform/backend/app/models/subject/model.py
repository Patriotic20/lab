from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.teacher.model import Teacher
    from app.models.question.model import Question
    from app.models.quiz.model import Quiz
    from app.models.subject_teacher.model import SubjectTeacher
    from app.models.results.model import Result


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

    def __str__(self):
        return self.name