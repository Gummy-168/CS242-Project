from enum import Enum

from sqlalchemy import Column, Integer, String

from database import Base


class AssignmentStatus(Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
