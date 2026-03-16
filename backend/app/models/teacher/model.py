from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.kafedra.model import Kafedra
    from app.models.subject.model import Subject
    from app.models.subject_teacher.model import SubjectTeacher
    from app.models.user.model import User

class Teacher(Base, IdIntPk, TimestampMixin):
    __tablename__ = "teachers"
    kafedra_id: Mapped[int] = mapped_column(ForeignKey("kafedras.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    last_name: Mapped[str] = mapped_column()
    first_name: Mapped[str] = mapped_column()
    third_name: Mapped[str] = mapped_column()
    full_name: Mapped[str] = mapped_column(unique=True)

    kafedra: Mapped["Kafedra"] = relationship("Kafedra", back_populates="teachers")

    subject_teachers: Mapped[list["SubjectTeacher"]] = relationship(
        "SubjectTeacher",
        back_populates="teacher",
    )

    user: Mapped["User"] = relationship("User", back_populates="teacher")

    def __str__(self):
        return self.full_name