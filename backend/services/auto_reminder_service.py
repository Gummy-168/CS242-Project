from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Assignment, AssignmentStatus, NotificationLog, User, UserNotificationSetting
from services.reminder_service import ReminderService

ALLOWED_REMINDER_DAYS = (1, 3, 5, 7)


def get_or_create_notification_setting(db: Session, user_id: int) -> UserNotificationSetting:
    setting = db.query(UserNotificationSetting).filter(UserNotificationSetting.user_id == user_id).first()
    if setting is None:
        setting = UserNotificationSetting(user_id=user_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def update_notification_setting(
    db: Session,
    user_id: int,
    email_enabled: bool,
    reminder_days: list[int],
) -> UserNotificationSetting:
    setting = get_or_create_notification_setting(db, user_id)
    chosen_days = set(reminder_days)
    setting.email_enabled = email_enabled
    setting.notify_1_day = 1 in chosen_days
    setting.notify_3_days = 3 in chosen_days
    setting.notify_5_days = 5 in chosen_days
    setting.notify_7_days = 7 in chosen_days
    db.commit()
    db.refresh(setting)
    return setting


def _build_reminder_message(assignment: Assignment, days_before_deadline: int) -> tuple[str, str]:
    deadline_text = assignment.deadline.strftime("%Y-%m-%d %H:%M")
    subject = f"Reminder: {assignment.title} is due in {days_before_deadline} day(s)"
    body = (
        "Hello,\n\n"
        f"This is an automatic reminder for your assignment '{assignment.title}'.\n"
        f"It is due on {deadline_text}.\n"
        f"You asked to be notified {days_before_deadline} day(s) before the deadline.\n\n"
        "Please make sure to submit it on time.\n\n"
        "Best regards,\n"
        "Your Assignment Tracker"
    )
    return subject, body


def process_automatic_reminders(db: Session, now: datetime | None = None) -> int:
    current_time = now or datetime.utcnow()
    reminder_service = ReminderService.from_env(reminder_type="EMAIL", notify_before_days=1)
    if not reminder_service.validate_email_config():
        return 0

    settings = (
        db.query(UserNotificationSetting)
        .filter(UserNotificationSetting.email_enabled.is_(True))
        .all()
    )

    sent_count = 0
    for setting in settings:
        enabled_days = setting.enabled_days()
        if not enabled_days:
            continue

        user = db.query(User).filter(User.id == setting.user_id).first()
        if user is None or not user.email:
            continue

        assignments = (
            db.query(Assignment)
            .filter(
                Assignment.user_id == setting.user_id,
                Assignment.status.in_([AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS]),
                Assignment.deadline > current_time,
            )
            .order_by(Assignment.deadline.asc())
            .all()
        )

        for assignment in assignments:
            for days_before_deadline in enabled_days:
                trigger_at = assignment.deadline - timedelta(days=days_before_deadline)
                if trigger_at > current_time:
                    continue

                existing_log = (
                    db.query(NotificationLog)
                    .filter(
                        NotificationLog.user_id == setting.user_id,
                        NotificationLog.assignment_id == assignment.id,
                        NotificationLog.days_before_deadline == days_before_deadline,
                    )
                    .first()
                )
                if existing_log is not None:
                    continue

                subject, body = _build_reminder_message(assignment, days_before_deadline)
                success = reminder_service.send_email_notification(user.email, subject, body)
                if not success:
                    continue

                db.add(
                    NotificationLog(
                        user_id=setting.user_id,
                        assignment_id=assignment.id,
                        days_before_deadline=days_before_deadline,
                    )
                )
                db.commit()
                sent_count += 1

    return sent_count
