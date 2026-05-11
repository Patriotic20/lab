from datetime import date as date_type
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.group.models.group import Group
    from app.modules.student.model import Student
    from app.modules.user.models.user import User


class StudentMovement(Base, IdIntPk, TimestampMixin):
    __tablename__ = "student_movements"

    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # one of: enrollment | transfer | leave | return | expulsion | graduation

    from_group_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True
    )
    to_group_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True
    )
    from_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    order_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    order_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    effective_date: Mapped[date_type] = mapped_column(Date, nullable=False)

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    student: Mapped["Student"] = relationship("Student")
    from_group: Mapped["Group | None"] = relationship("Group", foreign_keys=[from_group_id])
    to_group: Mapped["Group | None"] = relationship("Group", foreign_keys=[to_group_id])
    created_by: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_user_id])

    def __str__(self):
        return f"Movement {self.id} ({self.movement_type}, student={self.student_id})"
