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


# ── Teacher ranking schemas ───────────────────────────────────────────────────

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
    avg_grade: float         # plain AVG(grade) on 2–5 scale
    weighted_rating: float   # Bayesian-adjusted rating, also 2–5

    model_config = ConfigDict(from_attributes=True)


class TeacherRankingResponse(BaseModel):
    total: int
    page: int = 1
    limit: int = 10
    teachers: list[TeacherRankItem]
    # active filters (None = no filter applied)
    faculty_id: Optional[int] = None
    kafedra_id: Optional[int] = None
    group_id: Optional[int] = None
    search: Optional[str] = None


# ── Faculty ranking schemas ───────────────────────────────────────────────────

class FacultyRankItem(BaseModel):
    """A single faculty entry in a faculty ranking list."""
    rank: int
    faculty_id: int
    faculty_name: str
    kafedra_count: int
    student_count: int
    avg_grade: float
    weighted_rating: float

    model_config = ConfigDict(from_attributes=True)


class FacultyRankingResponse(BaseModel):
    total: int
    page: int = 1
    limit: int = 10
    faculties: list[FacultyRankItem]


# ── Kafedra ranking schemas ───────────────────────────────────────────────────

class KafedraRankItem(BaseModel):
    """A single kafedra (chair) entry in a kafedra ranking list."""
    rank: int
    kafedra_id: int
    kafedra_name: str
    faculty_id: int
    faculty_name: str
    teacher_count: int
    student_count: int
    avg_grade: float
    weighted_rating: float

    model_config = ConfigDict(from_attributes=True)


class KafedraRankingResponse(BaseModel):
    total: int
    page: int = 1
    limit: int = 10
    kafedras: list[KafedraRankItem]

