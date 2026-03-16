from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user.model import User
    from app.models.quiz.model import Quiz
    from app.models.subject.model import Subject
    from app.models.group.model import Group

class Result(Base, IdIntPk, TimestampMixin):
    __tablename__ = "results"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    wrong_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="results")
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="results")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="results")
    group: Mapped["Group"] = relationship("Group", back_populates="results")

    def __str__(self):
        return f"Result {self.id} - Grade: {self.grade}"
