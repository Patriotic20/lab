from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.group.model import Group
    from app.models.user.model import User


class GroupTeacher(Base, IdIntPk, TimestampMixin):
    __tablename__ = "group_teachers"
    __table_args__ = (
        UniqueConstraint("group_id", "teacher_id", name="idx_unique_group_teacher"),
    )

    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    group: Mapped["Group"] = relationship("Group", back_populates="group_teachers")
    teacher: Mapped["User"] = relationship("User", back_populates="group_teachers")

    def __str__(self):
        return f"{self.group_id} - {self.teacher_id}"
