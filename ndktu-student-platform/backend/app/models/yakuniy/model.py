from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user.model import User
    from app.models.subject.model import Subject


class Yakuniy(Base, IdIntPk, TimestampMixin):
    __tablename__ = "yakuniy"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[int] = mapped_column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="yakuniy_results")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="yakuniy_results")

    def __str__(self):
        return f"Yakuniy {self.id} - Grade: {self.grade}"
