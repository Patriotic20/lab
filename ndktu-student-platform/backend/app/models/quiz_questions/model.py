from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.quiz.model import Quiz
    from app.models.question.model import Question


class QuizQuestion(Base, IdIntPk, TimestampMixin):
    __tablename__ = "quiz_questions"
    
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="quiz_questions")
    question: Mapped["Question"] = relationship("Question", back_populates="quiz_questions")

    def __str__(self):
        return f"{self.quiz.title} - {self.question.text}"