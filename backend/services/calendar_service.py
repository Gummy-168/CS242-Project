from datetime import date, datetime
from typing import Optional

from database import SessionLocal
from models import Assignment


def _serialize_assignment(assignment: Assignment) -> dict[str, object]:
    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "deadline": assignment.deadline,
        "priority": assignment.priority,
        "status": assignment.status,
        "tag_color": assignment.tag_color,
        "user_id": assignment.user_id,
        "course_id": assignment.course_id,
        "score": assignment.score,
        "difficulty": assignment.difficulty,
    }


def get_calendar_assignments(user_id: Optional[int] = None) -> list[dict[str, object]]:
    db = SessionLocal()
    try:
        query = db.query(Assignment)
        if user_id is not None:
            query = query.filter(Assignment.user_id == user_id)
        assignments = query.order_by(Assignment.deadline.asc()).all()
        return [_serialize_assignment(assignment) for assignment in assignments]
    finally:
        db.close()


def get_today_assignments(user_id: Optional[int] = None) -> list[dict[str, object]]:
    today = date.today()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    db = SessionLocal()
    try:
        query = db.query(Assignment).filter(
            Assignment.deadline >= start,
            Assignment.deadline <= end,
        )
        if user_id is not None:
            query = query.filter(Assignment.user_id == user_id)
        assignments = query.order_by(Assignment.deadline.asc()).all()
        return [_serialize_assignment(assignment) for assignment in assignments]
    finally:
        db.close()
