from __future__ import annotations

from datetime import datetime

from models import AssignmentStatus


class Assignment:
    def __init__(
        self,
        _assignment_id: int,
        _title: str,
        _description: str,
        _deadline: datetime,
        _priority: int,
        _status: AssignmentStatus,
        _course_id: int,
        _score: float,
        _course_name: str,
    ) -> None:
        self._assignment_id = _assignment_id
        self._title = _title
        self._description = _description
        self._deadline = _deadline
        self._priority = _priority
        self._status = _status
        self._course_id = _course_id
        self._score = _score
        self._course_name = _course_name

    def get_title(self) -> str:
        ...

    def set_title(self, title: str) -> None:
        ...

    def get_status(self) -> AssignmentStatus:
        ...

    def set_status(self, status: AssignmentStatus) -> None:
        ...

    def mark_complete(self) -> None:
        ...

    def is_overdue(self, current_time: datetime | None = None) -> bool:
        ...

    def days_remaining(self, current_time: datetime | None = None) -> int:
        ...

    def update_priority(self, priority: int) -> None:
        ...

    def validate_deadline(self) -> bool:
        ...

    def validate_status_transition(self, new_status: AssignmentStatus) -> bool:
        ...
