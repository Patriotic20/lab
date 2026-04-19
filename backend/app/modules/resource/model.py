from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
from app.core.mixins.id_int_pk import IdIntPk
from app.core.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.modules.subject.models.subject_teacher import SubjectTeacher


class Resource(Base, IdIntPk, TimestampMixin):
    __tablename__ = "resources"

    subject_teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subject_teachers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    main_text: Mapped[str] = mapped_column(Text, nullable=False)

    links: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    subject_teacher: Mapped["SubjectTeacher"] = relationship(
        "SubjectTeacher", back_populates="resources"
    )

    def __str__(self):
        return f"Resource {self.id} (subject_teacher_id={self.subject_teacher_id})"
