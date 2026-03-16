from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.teacher.model import Teacher
    from app.models.faculty.model import Faculty

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