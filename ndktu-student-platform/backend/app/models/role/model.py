from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.permission.model import Permission
    from app.models.user.model import User


class Role(Base, IdIntPk, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True)

    users: Mapped[list["User"]] = relationship(
        "User", secondary="user_roles", back_populates="roles", overlaps="user_roles"
    )

    permissions: Mapped[list["Permission"]] = relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
        overlaps="role_permissions",
    )

    def __str__(self):
        return self.name
