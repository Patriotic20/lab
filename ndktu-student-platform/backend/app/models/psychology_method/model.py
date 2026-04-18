from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

from sqlalchemy import String
from typing import Any
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

class PsychologyMethod(Base, IdIntPk, TimestampMixin):
    __tablename__ = "psychology_methods"

    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
    instruction: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    
    
    def __str__(self):
        return f"PsychologyMethod(id={self.id})"