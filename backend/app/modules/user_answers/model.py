from sqlalchemy import Integer, ForeignKey, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.user.models.user import User
    from app.modules.quiz.models.quiz import Quiz
    from app.modules.question.model import Question

class UserAnswers(Base, IdIntPk, TimestampMixin):
    __tablename__ = "user_answers"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    answer: Mapped[str] = mapped_column(String, nullable=True)
    correct_answer: Mapped[str | None] = mapped_column(String, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="user_answers")
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="user_answers")
    question: Mapped["Question"] = relationship("Question", back_populates="user_answers")

    def __str__(self):
        return f"UserAnswer {self.id} - {self.answer}"
