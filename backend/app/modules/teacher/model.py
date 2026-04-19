from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.kafedra.model import Kafedra
    from app.modules.subject.models.subject import Subject
    from app.modules.subject.models.subject_teacher import SubjectTeacher
    from app.modules.user.models.user import User

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
