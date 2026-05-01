from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from models.assignment import Assignment


class Course(Base):
    __tablename__ = "courses"

    id = Column("course_id", Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_name = Column(String(255), nullable=False, index=True)
    instructor_name = Column(String(255), nullable=True)
    semester = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship("Assignment", backref="course", cascade="all, delete-orphan")

    def get_course_name(self) -> str:
        return self.course_name

    def set_course_name(self, course_name: str) -> None:
        self.course_name = course_name.strip()

    def validate_course_name(self) -> bool:
        return bool(self.course_name and self.course_name.strip())

    def add_assignment(self, assignment: Assignment) -> None:
        self.assignments.append(assignment)

    def remove_assignment(self, assignment_id: int) -> None:
        self.assignments = [a for a in self.assignments if a.id != assignment_id]

    def get_all_assignments(self) -> list[Assignment]:
        return list(self.assignments)
