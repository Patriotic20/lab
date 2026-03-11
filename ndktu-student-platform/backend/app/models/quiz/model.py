from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.subject.model import Subject
    from app.models.user.model import User
    from app.models.group.model import Group
    from app.models.quiz_questions.model import QuizQuestion
    from app.models.results.model import Result
    from app.models.user_answers.model import UserAnswers


class Quiz(Base, IdIntPk, TimestampMixin):
    __tablename__ = "quizzes"
    
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=True,
    )
    subject_id: Mapped[int | None] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=True,
    )
    

    title: Mapped[str] = mapped_column(nullable=False)
    question_number: Mapped[int] = mapped_column(nullable=False)
    duration: Mapped[int] = mapped_column(nullable=False)
    pin: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    attempt: Mapped[int | None] = mapped_column(nullable=True, default=1)
    

    user: Mapped["User"] = relationship(
        "User", 
        back_populates="quizzes"
    )

    group: Mapped["Group"] = relationship(
        "Group", 
        back_populates="quizzes"
    )

    subject: Mapped["Subject"] = relationship(
        "Subject", 
        back_populates="quizzes"
    )

    quiz_questions: Mapped[list["QuizQuestion"]] = relationship(
        "QuizQuestion",
        back_populates="quiz",
    )

    results: Mapped[list["Result"]] = relationship(
        "Result", 
        back_populates="quiz"
    )

    user_answers: Mapped[list["UserAnswers"]] = relationship(
        "UserAnswers", 
        back_populates="quiz"
    )

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "questions": [qq.question.to_dict() for qq in self.quiz_questions],
        }