from sqlalchemy import Integer, ForeignKey, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.user.models.user import User
    from app.modules.quiz.models.quiz import Quiz
    from app.modules.subject.models.subject import Subject
    from app.modules.group.models.group import Group

class Result(Base, IdIntPk, TimestampMixin):
    __tablename__ = "results"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)

    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    wrong_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)

    cheating_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    reason_for_stop: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cheating_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="results")
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="results")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="results")
    group: Mapped["Group"] = relationship("Group", back_populates="results")

    def __str__(self):
        return f"Result {self.id} - Grade: {self.grade}"
