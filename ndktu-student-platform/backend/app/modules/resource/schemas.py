from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, HttpUrl, field_validator


class ResourceLink(BaseModel):
    """A single link entry inside a Resource."""
    title: str
    url: str

    model_config = ConfigDict(from_attributes=True)


class ResourceSubjectTeacherInfo(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    model_config = ConfigDict(from_attributes=True)


class ResourceCreateRequest(BaseModel):
    subject_teacher_id: int
    main_text: str
    links: List[ResourceLink] = []


class ResourceUpdateRequest(BaseModel):
    main_text: Optional[str] = None
    links: Optional[List[ResourceLink]] = None


class ResourceResponse(BaseModel):
    id: int
    subject_teacher_id: int
    main_text: str
    links: List[ResourceLink]
    created_at: datetime
    updated_at: datetime
    subject_teacher: Optional[ResourceSubjectTeacherInfo] = None

    model_config = ConfigDict(from_attributes=True)


class ResourceListRequest(BaseModel):
    subject_teacher_id: Optional[int] = None

    page: int = 1
    limit: int = 20

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit


class ResourceListResponse(BaseModel):
    total: int
    page: int
    limit: int
    resources: List[ResourceResponse]
