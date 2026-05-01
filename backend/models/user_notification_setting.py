from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer

from database import Base


class UserNotificationSetting(Base):
    __tablename__ = "user_notification_settings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    email_enabled = Column(Boolean, nullable=False, default=False)
    notify_1_day = Column(Boolean, nullable=False, default=False)
    notify_3_days = Column(Boolean, nullable=False, default=False)
    notify_5_days = Column(Boolean, nullable=False, default=False)
    notify_7_days = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def enabled_days(self) -> list[int]:
        selected_days: list[int] = []
        if self.notify_1_day:
            selected_days.append(1)
        if self.notify_3_days:
            selected_days.append(3)
        if self.notify_5_days:
            selected_days.append(5)
        if self.notify_7_days:
            selected_days.append(7)
        return selected_days
