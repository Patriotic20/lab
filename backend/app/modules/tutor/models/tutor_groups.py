from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.group.models.group import Group
    from app.modules.tutor.models.tutor import Tutor


class TutorGroup(Base, IdIntPk, TimestampMixin):
    __tablename__ = "tutor_groups"
    __table_args__ = (
        UniqueConstraint("tutor_id", "group_id", name="idx_unique_tutor_group"),
    )

    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))

    tutor: Mapped["Tutor"] = relationship("Tutor", back_populates="tutor_groups")
    group: Mapped["Group"] = relationship("Group", back_populates="tutor_groups")

    def __str__(self):
        return f"{self.tutor_id} - {self.group_id}"
