from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.group.models.group import Group
    from app.modules.kafedra.model import Kafedra


class Faculty(Base, IdIntPk, TimestampMixin):
    __tablename__ = "faculties"
    name: Mapped[str] = mapped_column(String(50), unique=True)

    def __str__(self):
        return self.name

    kafedras: Mapped[list["Kafedra"]] = relationship("Kafedra", back_populates="faculty")

    groups: Mapped[list["Group"]] = relationship("Group", back_populates="faculty")
