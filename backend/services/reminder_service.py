from __future__ import annotations

from datetime import datetime

from models.assignment import Assignment


class ReminderService:
    def __init__(
        self,
        _reminder_type: str,
        _notify_before_days: int,
        _email_api_key: str,
        _sender_email: str,
    ) -> None:
        self._reminder_type = _reminder_type
        self._notify_before_days = _notify_before_days
        self._email_api_key = _email_api_key
        self._sender_email = _sender_email

    def send_reminder(self, assignment: Assignment, recipient_email: str) -> bool:
        ...

    def sync_to_calendar(self, assignments: list[Assignment]) -> dict[str, list[datetime]]:
        ...

    def schedule_notification(self, assignment: Assignment) -> datetime:
        ...

    def validate_reminder_settings(self) -> bool:
        ...

    def send_email_notification(self, recipient_email: str, subject: str, body: str) -> bool:
        ...

    def validate_email_config(self) -> bool:
        ...
