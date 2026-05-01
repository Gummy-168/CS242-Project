from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class WorkspaceSubject(Base):
    __tablename__ = "workspace_subjects"

    id = Column("subject_id", Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    color = Column(String(7), nullable=False, default="#C589FF")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="workspace_subjects")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_workspace_subjects_user_name"),
    )

    def set_name(self, name: str) -> None:
        self.name = name.strip()

    def set_color(self, color: str) -> None:
        self.color = color
