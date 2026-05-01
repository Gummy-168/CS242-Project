from __future__ import annotations

from datetime import datetime

from models import AssignmentStatus
from models.assignment import Assignment
from models.course import Course
from services.assignment_statistics import AssignmentStatistics


class AssignmentManager:
    def __init__(
        self,
        _assignments: list[Assignment] | None = None,
        _courses: list[Course] | None = None,
    ) -> None:
        self._assignments = _assignments or []
        self._courses = _courses or []

    def create_assignment(
        self,
        assignment_id: int,
        title: str,
        description: str,
        deadline: datetime,
        priority: int,
        status: AssignmentStatus,
        course_id: int,
        score: float,
        course_name: str,
    ) -> Assignment:
        ...

    def edit_assignment(self, assignment_id: int, **updates: object) -> Assignment | None:
        ...

    def delete_assignment(self, assignment_id: int) -> bool:
        ...

    def filter_by_course(self, course_id: int) -> list[Assignment]:
        ...

    def sort_by_deadline(self, reverse: bool = False) -> list[Assignment]:
        ...

    def get_upcoming_assignments(self, within_days: int = 7) -> list[Assignment]:
        ...

    def get_overdue_assignments(self) -> list[Assignment]:
        ...

    def calculate_workload_summary(self) -> AssignmentStatistics:
        ...

    def search_assignments(self, keyword: str) -> list[Assignment]:
        ...

    def filter_by_status(self, status: AssignmentStatus) -> list[Assignment]:
        ...

    def get_calendar_data(self) -> dict[str, list[Assignment]]:
        ...
