from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.role.model import Role
    from app.models.user.model import User


class UserRole(Base, IdIntPk, TimestampMixin):
    __tablename__ = "user_roles"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["User"] = relationship("User", lazy="selectin", overlaps="roles,users")
    role: Mapped["Role"] = relationship("Role", lazy="selectin", overlaps="roles,users")
