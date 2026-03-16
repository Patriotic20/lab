from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.user.model import User


from sqlalchemy import Date, Float, ForeignKey, Integer, String


class Student(Base, TimestampMixin, IdIntPk):
    __tablename__ = "students"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    group_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True
    )

    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    third_name: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    student_id_number: Mapped[str] = mapped_column(String)
    image_path: Mapped[str] = mapped_column(String)
    birth_date: Mapped[Date] = mapped_column(Date)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    gender: Mapped[str] = mapped_column(String)
    university: Mapped[str] = mapped_column(String)
    specialty: Mapped[str] = mapped_column(String)
    student_status: Mapped[str] = mapped_column(String)
    education_form: Mapped[str] = mapped_column(String)
    education_type: Mapped[str] = mapped_column(String)
    payment_form: Mapped[str] = mapped_column(String)
    education_lang: Mapped[str] = mapped_column(String)
    faculty: Mapped[str] = mapped_column(String)
    level: Mapped[str] = mapped_column(String)
    semester: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    avg_gpa: Mapped[float] = mapped_column(Float)

    group: Mapped["Group"] = relationship("Group", back_populates="students")
    user: Mapped["User"] = relationship("User", back_populates="student")
