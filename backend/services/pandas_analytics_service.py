from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
from sqlalchemy.orm import Session, joinedload

from models import Assignment


def get_task_insights(db: Session, user_id: int) -> dict[str, object]:
    assignments = (
        db.query(Assignment)
        .options(joinedload(Assignment.course))
        .filter(Assignment.user_id == user_id)
        .all()
    )

    rows = [
        {
            "id": assignment.id,
            "title": assignment.title,
            "course_name": assignment.course_name or "Unknown Course",
            "priority": assignment.priority.value if hasattr(assignment.priority, "value") else str(assignment.priority),
            "status": assignment.status.value if hasattr(assignment.status, "value") else str(assignment.status),
            "deadline": assignment.deadline,
        }
        for assignment in assignments
    ]

    if not rows:
        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow(),
            "priority_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "priority_summary": [],
            "upcoming_total": 0,
            "upcoming_deadlines": [],
        }

    dataframe = pd.DataFrame(rows)
    dataframe["deadline"] = pd.to_datetime(dataframe["deadline"], utc=False)

    priority_counts_series = (
        dataframe["priority"]
        .value_counts()
        .reindex(["HIGH", "MEDIUM", "LOW"], fill_value=0)
    )
    priority_counts = {
        priority: int(count)
        for priority, count in priority_counts_series.items()
    }
    priority_summary = [
        {"priority": priority, "count": int(count)}
        for priority, count in priority_counts_series.items()
    ]

    now = datetime.utcnow()
    next_seven_days = now + timedelta(days=7)
    upcoming = dataframe[
        (dataframe["deadline"] >= now) & (dataframe["deadline"] <= next_seven_days)
    ].copy()
    upcoming = upcoming.sort_values(by=["deadline", "priority", "title"], ascending=[True, True, True])

    upcoming_deadlines: list[dict[str, object]] = []
    for row in upcoming.to_dict(orient="records"):
        deadline = row["deadline"]
        if hasattr(deadline, "to_pydatetime"):
            deadline = deadline.to_pydatetime()
        days_remaining = max(0, int((deadline - now).total_seconds() // 86400))
        upcoming_deadlines.append(
            {
                "id": int(row["id"]),
                "title": str(row["title"]),
                "course_name": str(row["course_name"]),
                "priority": str(row["priority"]),
                "status": str(row["status"]),
                "deadline": deadline,
                "days_remaining": days_remaining,
            }
        )

    return {
        "user_id": user_id,
        "generated_at": datetime.utcnow(),
        "priority_counts": priority_counts,
        "priority_summary": priority_summary,
        "upcoming_total": len(upcoming_deadlines),
        "upcoming_deadlines": upcoming_deadlines,
    }
