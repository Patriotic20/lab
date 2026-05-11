from datetime import date as date_type
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

MOVEMENT_TYPE = Literal["enrollment", "transfer", "leave", "return", "expulsion", "graduation"]


class GroupShortInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class StudentMovementCreateRequest(BaseModel):
    student_id: int
    movement_type: MOVEMENT_TYPE
    from_group_id: Optional[int] = None
    to_group_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    order_number: Optional[str] = Field(default=None, max_length=100)
    order_date: Optional[date_type] = None
    effective_date: date_type
    reason: Optional[str] = None


class StudentMovementUpdateRequest(BaseModel):
    movement_type: Optional[MOVEMENT_TYPE] = None
    from_group_id: Optional[int] = None
    to_group_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    order_number: Optional[str] = Field(default=None, max_length=100)
    order_date: Optional[date_type] = None
    effective_date: Optional[date_type] = None
    reason: Optional[str] = None


class StudentMovementResponse(BaseModel):
    id: int
    student_id: int
    movement_type: str
    from_group_id: Optional[int] = None
    to_group_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    order_number: Optional[str] = None
    order_date: Optional[date_type] = None
    effective_date: date_type
    reason: Optional[str] = None
    created_by_user_id: Optional[int] = None
    from_group: Optional[GroupShortInfo] = None
    to_group: Optional[GroupShortInfo] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentMovementListResponse(BaseModel):
    movements: List[StudentMovementResponse]
