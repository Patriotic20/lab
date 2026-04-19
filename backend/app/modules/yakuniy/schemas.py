from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class YakuniyUserInfo(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)


class YakuniySubjectInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class YakuniyCreateRequest(BaseModel):
    user_id: int
    subject_id: int
    grade: int


class YakuniyUpdateRequest(BaseModel):
    user_id: Optional[int] = None
    subject_id: Optional[int] = None
    grade: Optional[int] = None


class YakuniyResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    grade: int
    created_at: datetime
    updated_at: datetime

    user: Optional[YakuniyUserInfo] = None
    subject: Optional[YakuniySubjectInfo] = None
    student_name: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )

    @model_validator(mode="before")
    @classmethod
    def extract_student_data(cls, data):
        if hasattr(data, "__dict__"):
            if "user" in data.__dict__ and data.user:
                user = data.user
                if hasattr(user, "__dict__") and "student" in user.__dict__ and user.student:
                    data.student_name = user.student.full_name
        return data


class YakuniyListRequest(BaseModel):
    user_id: Optional[int] = None
    subject_id: Optional[int] = None
    grade: Optional[int] = None
    username: Optional[str] = None

    page: int = 1
    limit: int = 10

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit


class YakuniyListResponse(BaseModel):
    total: int
    page: int
    limit: int
    yakuniy_results: list[YakuniyResponse]
