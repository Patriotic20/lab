from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.academic_year.model import AcademicYear
    from app.modules.group.models.group import Group
    from app.modules.lesson.model import Lesson
    from app.modules.resource.model import Resource
    from app.modules.subject.models.subject import Subject
    from app.modules.user.models.user import User


class Sinf(Base, IdIntPk, TimestampMixin):
    __tablename__ = "sinfs"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    subject_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subjects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    academic_year_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("academic_years.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    semester_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    subject: Mapped["Subject"] = relationship("Subject")
    teacher: Mapped["User"] = relationship("User")
    academic_year: Mapped["AcademicYear | None"] = relationship("AcademicYear")

    sinf_groups: Mapped[list["SinfGroup"]] = relationship(
        "SinfGroup",
        back_populates="sinf",
        cascade="all, delete-orphan",
    )

    groups: Mapped[list["Group"]] = relationship(
        "Group",
        secondary="sinf_groups",
        viewonly=True,
    )

    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson",
        back_populates="sinf",
    )

    resources: Mapped[list["Resource"]] = relationship(
        "Resource",
        back_populates="sinf",
    )

    def __str__(self):
        return f"Sinf {self.id} ({self.name})"


class SinfGroup(Base, IdIntPk, TimestampMixin):
    __tablename__ = "sinf_groups"
    __table_args__ = (UniqueConstraint("sinf_id", "group_id", name="uq_sinf_group"),)

    sinf_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sinfs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sinf: Mapped["Sinf"] = relationship("Sinf", back_populates="sinf_groups")
    group: Mapped["Group"] = relationship("Group")

    def __str__(self):
        return f"SinfGroup sinf={self.sinf_id} group={self.group_id}"
