from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from sqlalchemy.orm import relationship

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.kafedra.model import Kafedra
    from app.models.group.model import Group

class Faculty(Base, IdIntPk, TimestampMixin):
    __tablename__ = "faculties"
    name: Mapped[str] = mapped_column(String(50), unique=True)

    def __str__(self):
        return self.name
        
    kafedras: Mapped[list["Kafedra"]] = relationship(
        "Kafedra", 
        back_populates="faculty"
    )

    groups: Mapped[list["Group"]] = relationship(
        "Group", 
        back_populates="faculty"
    )