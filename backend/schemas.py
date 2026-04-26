from datetime import datetime

from pydantic import BaseModel

from models import AssignmentPriority


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
    priority: AssignmentPriority
    status: str
    user_id: int


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    deadline: datetime
    priority: AssignmentPriority
    status: str
    user_id: int

    class Config:
        from_attributes = True


class AssignmentStatusUpdate(BaseModel):
    status: str
