from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class TeacherKafedraInfo(BaseModel):
    id: int
    name: str
    faculty_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class TeacherGroupInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class TeacherUserGroupTeacherInfo(BaseModel):
    group_id: int
    group: TeacherGroupInfo
    model_config = ConfigDict(from_attributes=True)

class TeacherSubjectInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class TeacherSubjectTeacherInfo(BaseModel):
    subject_id: int
    subject: TeacherSubjectInfo
    model_config = ConfigDict(from_attributes=True)

class TeacherUserInfo(BaseModel):
    id: int
    username: str
    group_teachers: list[TeacherUserGroupTeacherInfo] = []
    model_config = ConfigDict(from_attributes=True)


class TeacherCreateRequest(BaseModel):
    first_name: str
    last_name: str
    third_name: str
    kafedra_id: int
    user_id: int

    @field_validator("first_name", "last_name", "third_name", mode="before")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class TeacherCreateResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    full_name: str
    kafedra_id: int
    created_at: datetime  
    updated_at: datetime

    kafedra: Optional[TeacherKafedraInfo] = None
    user: Optional[TeacherUserInfo] = None
    subject_teachers: list[TeacherSubjectTeacherInfo] = []

    model_config = ConfigDict(
        from_attributes=True,
    )

class TeacherListRequest(BaseModel):
    full_name: Optional[str] = None 
    kafedra_id: Optional[int] = None
    
    page: int = 1 
    
    limit: int = 10 

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit

class TeacherListResponse(BaseModel):
    total: int
    page: int
    limit: int
    teachers: list[TeacherCreateResponse]

class TeacherGroupAssignRequest(BaseModel):
    user_id: int
    group_ids: list[int]

class TeacherSubjectAssignRequest(BaseModel):
    teacher_id: int
    subject_ids: list[int]

class TeacherAssignedSubjectsResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    full_name: str
    subject_teachers: list[TeacherSubjectTeacherInfo]

    model_config = ConfigDict(from_attributes=True)


class TeacherAssignedGroupsResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    full_name: str
    group_teachers: list[TeacherUserGroupTeacherInfo] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_group_teachers(cls, data: Any) -> Any:
        # When built from ORM object, groups are on teacher.user.group_teachers
        if hasattr(data, "user") and data.user is not None:
            data.__dict__["group_teachers"] = data.user.group_teachers
        return data


# ── Ranking schemas ──────────────────────────────────────────────────────────

class TeacherRankItem(BaseModel):
    """A single teacher entry in a ranking list."""
    rank: int
    teacher_id: int
    full_name: str
    kafedra_id: Optional[int] = None
    kafedra_name: Optional[str] = None
    faculty_id: Optional[int] = None
    faculty_name: Optional[str] = None
    # Present only when scope == "group"
    group_id: Optional[int] = None
    group_name: Optional[str] = None
    student_count: int
    total_grade: float
    avg_grade: float
    # Bayesian-weighted rating on the 2–5 scale
    # Pulls low-sample teachers toward the global mean.
    weighted_rating: float

    model_config = ConfigDict(from_attributes=True)


RankingScope = Literal["overall", "faculty", "kafedra", "group"]


class TeacherRankingResponse(BaseModel):
    scope: RankingScope
    scope_id: Optional[int] = None   # faculty_id / kafedra_id / group_id
    total: int
    teachers: list[TeacherRankItem]

