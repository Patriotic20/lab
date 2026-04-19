from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.teacher.model import Teacher
    from app.modules.faculty.model import Faculty

class Kafedra(Base, IdIntPk, TimestampMixin):
    __tablename__ = "kafedras"

    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"))
    name: Mapped[str] = mapped_column(String(255), unique=True)


    faculty: Mapped["Faculty"] = relationship(
        "Faculty",
        back_populates="kafedras"
    )


    teachers: Mapped[list["Teacher"]] = relationship(
        "Teacher",
        back_populates="kafedra"
    )

    def __str__(self):
        return self.name
