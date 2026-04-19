from typing import TYPE_CHECKING

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.modules.permission.model import Permission
    from app.modules.role.models.role import Role


class RolePermission(Base, IdIntPk, TimestampMixin):
    __tablename__ = "role_permissions"

    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False
    )

    role: Mapped["Role"] = relationship("Role", lazy="selectin", overlaps="permissions")
    permission: Mapped["Permission"] = relationship("Permission", lazy="selectin", overlaps="permissions")

    def __str__(self) -> str:
        return f"{self.role} → {self.permission}"
