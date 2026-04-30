from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from models import AssignmentPriority, AssignmentStatus


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AssignmentCreate(BaseModel):
    title: str
    description: str
    deadline: datetime
    priority: AssignmentPriority = AssignmentPriority.MEDIUM
    status: AssignmentStatus = AssignmentStatus.PENDING
    tag_color: str = Field(default="#A78BFA", pattern=r"^#[0-9A-Fa-f]{6}$")
    user_id: int
    course_id: int | None = None
    course_name: str | None = None
    score: float | None = Field(default=None, ge=0, le=100)
    difficulty: int | None = Field(default=None, ge=1, le=5)

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, value: AssignmentPriority | int | str) -> AssignmentPriority:
        if isinstance(value, AssignmentPriority):
            return value
        if isinstance(value, int):
            mapping = {
                1: AssignmentPriority.LOW,
                2: AssignmentPriority.MEDIUM,
                3: AssignmentPriority.HIGH,
            }
            if value in mapping:
                return mapping[value]
        if isinstance(value, str):
            raw = value.strip().upper()
            if raw.isdigit():
                return cls.normalize_priority(int(raw))
            try:
                return AssignmentPriority(raw)
            except ValueError:
                pass
        raise ValueError("priority must be LOW/MEDIUM/HIGH or 1/2/3")


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    deadline: datetime
    priority: AssignmentPriority
    status: AssignmentStatus
    tag_color: str
    user_id: int
    course_id: int
    course_name: str | None = None
    score: float | None = None
    difficulty: int | None = None

    class Config:
        from_attributes = True


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
