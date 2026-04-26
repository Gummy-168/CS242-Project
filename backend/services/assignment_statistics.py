from models.assignment import Assignment


class AssignmentStatistics:
    def __init__(
        self,
        _pending_count: int = 0,
        _in_progress_count: int = 0,
        _completed_count: int = 0,
        _overdue_count: int = 0,
    ) -> None:
        self._pending_count = _pending_count
        self._in_progress_count = _in_progress_count
        self._completed_count = _completed_count
        self._overdue_count = _overdue_count

    def get_pending_count(self) -> int:
        ...

    def set_pending_count(self, count: int) -> None:
        ...

    def calculate_remaining_assignments(self, assignments: list[Assignment]) -> int:
        ...

    def verify_counter_sync(self, assignments: list[Assignment]) -> bool:
        ...
