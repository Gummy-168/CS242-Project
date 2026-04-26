from __future__ import annotations

from models.assignment import Assignment


class Course:
    def __init__(
        self,
        _course_id: int,
        _course_name: str,
        _instructor_name: str,
        _semester: str,
    ) -> None:
        self._course_id = _course_id
        self._course_name = _course_name
        self._instructor_name = _instructor_name
        self._semester = _semester
        self._assignments: list[Assignment] = []

    def get_course_name(self) -> str:
        ...

    def set_course_name(self, course_name: str) -> None:
        ...

    def validate_course_name(self) -> bool:
        ...

    def add_assignment(self, assignment: Assignment) -> None:
        ...

    def remove_assignment(self, assignment_id: int) -> None:
        ...

    def get_all_assignments(self) -> list[Assignment]:
        ...
