from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.faculty.model import Faculty
    from app.models.student.model import Student
    from app.models.quiz.model import Quiz
    from app.models.results.model import Result
    from app.models.group_teachers.model import GroupTeacher


class Group(Base, IdIntPk, TimestampMixin):
    __tablename__ = "groups"
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"))
    
    name: Mapped[str] = mapped_column(String(255), unique=True)

    faculty: Mapped["Faculty"] = relationship(
        "Faculty", 
        back_populates="groups"
    )
    students: Mapped[list["Student"]] = relationship(
        "Student",
        back_populates="group"
    )

    quizzes: Mapped[list["Quiz"]] = relationship(
        "Quiz", 
        back_populates="group"
    )

    results: Mapped[list["Result"]] = relationship(
        "Result", 
        back_populates="group"
    )

    group_teachers: Mapped[list["GroupTeacher"]] = relationship(
        "GroupTeacher",
        back_populates="group",
        cascade="all, delete-orphan"
    )



    def __str__(self):
        return self.name