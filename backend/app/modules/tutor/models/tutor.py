from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.tutor.models.tutor_groups import TutorGroup
    from app.modules.user.models.user import User


class Tutor(Base, IdIntPk, TimestampMixin):
    __tablename__ = "tutors"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255))
    third_name: Mapped[str] = mapped_column(String(255))

    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="tutor")

    tutor_groups: Mapped[list["TutorGroup"]] = relationship(
        "TutorGroup",
        back_populates="tutor",
        cascade="all, delete-orphan",
    )

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.third_name}"
