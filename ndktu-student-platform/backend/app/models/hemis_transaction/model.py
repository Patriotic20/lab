from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.user.model import User
    from app.models.student.model import Student


class HemisTransaction(Base, IdIntPk, TimestampMixin):
    __tablename__ = "hemis_transactions"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True
    )

    login: Mapped[str] = mapped_column(String(100), nullable=False)
    login_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "local" | "hemis_api"
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # "success" | "failed"
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="hemis_transactions")
    student: Mapped["Student"] = relationship("Student", back_populates="hemis_transactions")

    def __str__(self):
        return f"HemisTransaction {self.id} - {self.login} ({self.status})"
