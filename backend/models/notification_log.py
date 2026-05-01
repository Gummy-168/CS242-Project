from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "assignment_id",
            "days_before_deadline",
            name="uq_notification_logs_user_assignment_days",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id", ondelete="CASCADE"), nullable=False, index=True)
    days_before_deadline = Column(Integer, nullable=False)
    sent_at = Column(DateTime, nullable=False, default=datetime.utcnow)
