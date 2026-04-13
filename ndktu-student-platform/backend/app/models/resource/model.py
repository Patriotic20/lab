from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, Text, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

if TYPE_CHECKING:
    from app.models.subject_teacher.model import SubjectTeacher


class Resource(Base, IdIntPk, TimestampMixin):
    __tablename__ = "resources"

    subject_teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subject_teachers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Main description / annotation for this resource set
    main_text: Mapped[str] = mapped_column(Text, nullable=False)

    # List of links stored as JSON array: [{"title": "...", "url": "..."}, ...]
    links: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    subject_teacher: Mapped["SubjectTeacher"] = relationship(
        "SubjectTeacher", back_populates="resources"
    )

    def __str__(self):
        return f"Resource {self.id} (subject_teacher_id={self.subject_teacher_id})"
