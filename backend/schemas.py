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


class ReminderSendRequest(BaseModel):
    user_id: int
    days_ahead: int = Field(default=1, ge=0, le=30)
    recipient_email: str | None = None


class NotificationSettingsUpdateRequest(BaseModel):
    email_enabled: bool
    reminder_days: list[int] = Field(default_factory=list)

    @field_validator("reminder_days")
    @classmethod
    def validate_reminder_days(cls, value: list[int]) -> list[int]:
        allowed = {1, 3, 5, 7}
        normalized = sorted(set(value))
        if any(day not in allowed for day in normalized):
            raise ValueError("reminder_days must only contain 1, 3, 5, or 7")
        return normalized


class NotificationSettingsResponse(BaseModel):
    user_id: int
    email_enabled: bool
    reminder_days: list[int]
    updated_at: datetime


class WorkspaceSubjectCreate(BaseModel):
    user_id: int
    name: str
    color: str = Field(default="#C589FF", pattern=r"^#[0-9A-Fa-f]{6}$")


class WorkspaceSubjectUpdate(BaseModel):
    name: str | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class WorkspaceSubjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
