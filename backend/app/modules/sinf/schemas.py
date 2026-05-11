from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SinfSubjectInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class SinfTeacherInfo(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SinfGroupInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class SinfAcademicYearInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class SinfCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    subject_id: int
    teacher_id: int
    description: Optional[str] = None
    academic_year_id: Optional[int] = None
    semester_number: Optional[int] = Field(default=None, ge=1, le=2)
    group_ids: List[int] = Field(default_factory=list)


class SinfUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    description: Optional[str] = None
    academic_year_id: Optional[int] = None
    semester_number: Optional[int] = Field(default=None, ge=1, le=2)
    group_ids: Optional[List[int]] = None


class SinfResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    subject_id: int
    teacher_id: int
    academic_year_id: Optional[int] = None
    semester_number: Optional[int] = None
    subject: Optional[SinfSubjectInfo] = None
    teacher: Optional[SinfTeacherInfo] = None
    academic_year: Optional[SinfAcademicYearInfo] = None
    groups: List[SinfGroupInfo] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SinfListRequest(BaseModel):
    teacher_id: Optional[int] = None
    subject_id: Optional[int] = None
    group_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    semester_number: Optional[int] = None
    page: int = 1
    limit: int = 20

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit


class SinfListResponse(BaseModel):
    total: int
    page: int
    limit: int
    sinfs: List[SinfResponse]
