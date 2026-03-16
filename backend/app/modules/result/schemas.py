from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class ResultUserInfo(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)


class ResultQuizInfo(BaseModel):
    id: int
    title: str
    model_config = ConfigDict(from_attributes=True)


class ResultSubjectInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ResultGroupInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ResultResponse(BaseModel):
    id: int
    user_id: Optional[int]
    quiz_id: Optional[int]
    subject_id: Optional[int]
    group_id: Optional[int]
    correct_answers: int
    wrong_answers: int
    grade: int
    created_at: datetime
    updated_at: datetime

    user: Optional[ResultUserInfo] = None
    quiz: Optional[ResultQuizInfo] = None
    subject: Optional[ResultSubjectInfo] = None
    group: Optional[ResultGroupInfo] = None
    student_id: Optional[str] = None
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
                    student = user.student
                    data.student_id = student.student_id_number
                    data.student_name = student.full_name
        return data


class ResultListRequest(BaseModel):
    user_id: Optional[int] = None
    quiz_id: Optional[int] = None
    subject_id: Optional[int] = None
    group_id: Optional[int] = None
    grade: Optional[int] = None
    
    page: int = 1
    limit: int = 10

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit

class ResultListResponse(BaseModel):
    total: int
    page: int
    limit: int
    results: list[ResultResponse]
