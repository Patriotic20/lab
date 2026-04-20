from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class TutorGroupInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class TutorTutorGroupInfo(BaseModel):
    group_id: int
    group: TutorGroupInfo
    model_config = ConfigDict(from_attributes=True)


class TutorUserInfo(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)


class TutorCreateRequest(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    image_url: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator("first_name", "last_name", "third_name", mode="before")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class TutorUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    third_name: Optional[str] = None
    image_url: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator("first_name", "last_name", "third_name", mode="before")
    @classmethod
    def must_not_be_empty(cls, v):
        if v is None:
            return v
        if not str(v).strip():
            raise ValueError("Field cannot be empty")
        return str(v).strip()


class TutorResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    image_url: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    user: Optional[TutorUserInfo] = None
    tutor_groups: list[TutorTutorGroupInfo] = []

    model_config = ConfigDict(from_attributes=True)


class TutorListRequest(BaseModel):
    search: Optional[str] = None
    page: int = 1
    limit: int = 10

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit


class TutorListResponse(BaseModel):
    total: int
    page: int
    limit: int
    tutors: list[TutorResponse]


class TutorAssignGroupsRequest(BaseModel):
    tutor_id: int
    group_ids: list[int]
