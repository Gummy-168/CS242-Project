from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text

from database import Base


class AssignmentStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class AssignmentPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column("assignment_id", Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False, index=True)
    priority = Column(SqlEnum(AssignmentPriority), nullable=False, default=AssignmentPriority.MEDIUM)
    status = Column(SqlEnum(AssignmentStatus), nullable=False, default=AssignmentStatus.PENDING, index=True)
    tag_color = Column(String(7), nullable=False, default="#A78BFA")
    score = Column(Float, nullable=True)
    difficulty = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def course_name(self) -> str | None:
        course = getattr(self, "course", None)
        return course.course_name if course is not None else None

    def get_title(self) -> str:
        return self.title

    def set_title(self, title: str) -> None:
        self.title = title.strip()

    def get_status(self) -> AssignmentStatus:
        return self.status

    def set_status(self, status: AssignmentStatus) -> None:
        if not self.validate_status_transition(status):
            raise ValueError(f"Invalid status transition: {self.status} -> {status}")
        self.status = status

    def mark_complete(self) -> None:
        self.status = AssignmentStatus.COMPLETED

    def is_overdue(self, current_time: datetime | None = None) -> bool:
        now = current_time or datetime.utcnow()
        return self.deadline < now and self.status != AssignmentStatus.COMPLETED

    def days_remaining(self, current_time: datetime | None = None) -> int:
        now = current_time or datetime.utcnow()
        return (self.deadline - now).days

    def update_priority(self, priority: AssignmentPriority) -> None:
        self.priority = priority

    def validate_deadline(self) -> bool:
        return self.deadline > datetime.utcnow()

    def validate_status_transition(self, new_status: AssignmentStatus) -> bool:
        allowed_transitions = {
            AssignmentStatus.PENDING: {
                AssignmentStatus.PENDING,
                AssignmentStatus.IN_PROGRESS,
                AssignmentStatus.COMPLETED,
                AssignmentStatus.OVERDUE,
            },
            AssignmentStatus.IN_PROGRESS: {
                AssignmentStatus.IN_PROGRESS,
                AssignmentStatus.COMPLETED,
                AssignmentStatus.OVERDUE,
            },
            AssignmentStatus.COMPLETED: {AssignmentStatus.COMPLETED},
            AssignmentStatus.OVERDUE: {
                AssignmentStatus.OVERDUE,
                AssignmentStatus.IN_PROGRESS,
                AssignmentStatus.COMPLETED,
            },
        }
        return new_status in allowed_transitions.get(self.status, set())
