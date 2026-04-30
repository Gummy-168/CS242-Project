import asyncio
import contextlib
import os
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import case, func, text
from sqlalchemy.orm import Session, joinedload

from database import Base, SessionLocal, engine, get_db
from models import Assignment, AssignmentPriority, AssignmentStatus, Course, User, WorkspaceSubject
from services.auto_reminder_service import (
    get_or_create_notification_setting,
    process_automatic_reminders,
    update_notification_setting,
)
from services.google_calendar_service import (
    disconnect_google_calendar,
    exchange_code_for_token,
    get_google_auth_url,
    sync_user_assignments,
    upsert_assignment_event,
    delete_assignment_event,
)
from services.pandas_analytics_service import get_task_insights
from services.reminder_service import ReminderService
from schemas import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentStatusUpdate,
    LoginRequest,
    NotificationSettingsResponse,
    NotificationSettingsUpdateRequest,
    ReminderSendRequest,
    RegisterRequest,
    TaskInsightsResponse,
    WorkspaceSubjectCreate,
    WorkspaceSubjectResponse,
    WorkspaceSubjectUpdate,
)

from fastapi.middleware.cors import CORSMiddleware


def serialize_notification_setting(setting) -> NotificationSettingsResponse:
    return NotificationSettingsResponse(
        user_id=setting.user_id,
        email_enabled=setting.email_enabled,
        reminder_days=setting.enabled_days(),
        updated_at=setting.updated_at,
    )


async def reminder_scheduler_loop() -> None:
    interval_raw = os.getenv("REMINDER_CHECK_INTERVAL_SECONDS", "60").strip()
    try:
        interval_seconds = max(30, int(interval_raw))
    except ValueError:
        interval_seconds = 60

    while True:
        db = SessionLocal()
        try:
            sent_count = process_automatic_reminders(db)
            if sent_count:
                print(f"Auto reminder scheduler sent {sent_count} notification(s).")
        except Exception as exc:
            print(f"Auto reminder scheduler failed: {exc}")
        finally:
            db.close()
        await asyncio.sleep(interval_seconds)


def run_pending_migrations() -> None:
    with engine.begin() as conn:
        # Migration: Add calendar_event_id column
        result = conn.execute(
            text(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'assignments' "
                "AND COLUMN_NAME = 'calendar_event_id'"
            )
        )
        row = result.first()
        if row is not None and row[0] == 0:
            conn.execute(
                text(
                    "ALTER TABLE assignments "
                    "ADD COLUMN calendar_event_id VARCHAR(255) NULL"
                )
            )

        result = conn.execute(
            text(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'assignments' "
                "AND INDEX_NAME = 'idx_assignments_calendar_event_id'"
            )
        )
        row = result.first()
        if row is not None and row[0] == 0:
            conn.execute(
                text(
                    "CREATE INDEX idx_assignments_calendar_event_id "
                    "ON assignments (calendar_event_id)"
                )
            )

        # Migration: Add score_total column
        result = conn.execute(
            text(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'assignments' "
                "AND COLUMN_NAME = 'score_total'"
            )
        )
        row = result.first()
        if row is not None and row[0] == 0:
            conn.execute(
                text(
                    "ALTER TABLE assignments "
                    "ADD COLUMN score_total FLOAT NULL"
                )
            )
            # Update existing records with score to have score_total = 100
            conn.execute(
                text(
                    "UPDATE assignments SET score_total = 100 WHERE score IS NOT NULL AND score_total IS NULL"
                )
            )

        # Create index for score_total if it doesn't exist
        result = conn.execute(
            text(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'assignments' "
                "AND INDEX_NAME = 'idx_assignments_score_total'"
            )
        )
        row = result.first()
        if row is not None and row[0] == 0:
            conn.execute(
                text(
                    "CREATE INDEX idx_assignments_score_total "
                    "ON assignments (score_total)"
                )
            )


# 1. นิยาม lifespan ก่อน
@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_pending_migrations()
    scheduler_task = asyncio.create_task(reminder_scheduler_loop())
    try:
        yield
    finally:
        scheduler_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await scheduler_task


# 2. สร้าง app แค่ครั้งเดียว และใส่ lifespan เข้าไปเลย
app = FastAPI(lifespan=lifespan)

# 3. ใส่ Middleware ให้กับ app ตัวนี้ (ตัวเดียวที่ใช้รันจริง)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



    
@app.post("/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        username=payload.username,
        password=payload.password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    get_or_create_notification_setting(db, user.id)

    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


@app.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
        },
    }


@app.post("/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
) -> Assignment:
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    course = None
    if payload.course_id is not None:
        course = (
            db.query(Course)
            .filter(Course.id == payload.course_id, Course.user_id == payload.user_id)
            .first()
        )

    if course is None and payload.course_name:
        course = (
            db.query(Course)
            .filter(
                Course.user_id == payload.user_id,
                Course.course_name == payload.course_name,
            )
            .first()
        )
        if course is None:
            course = Course(
                user_id=payload.user_id,
                course_name=payload.course_name,
            )
            db.add(course)
            db.flush()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course not found. Please provide a valid course_id or course_name.",
        )

    assignment = Assignment(
        title=payload.title,
        description=payload.description,
        deadline=payload.deadline,
        priority=payload.priority,
        status=payload.status,
        tag_color=payload.tag_color,
        user_id=payload.user_id,
        course_id=course.id,
        score=payload.score,
        score_total=payload.score_total,
        difficulty=payload.difficulty,
    )
    db.add(assignment)
    db.commit()

    try:
        event_id = upsert_assignment_event(db, assignment)
        assignment.calendar_event_id = event_id
        db.commit()
    except ValueError:
        # Google Calendar is not connected yet for this user.
        db.rollback()
    except Exception as exc:
        print(f"Failed to sync assignment {assignment.id} to Google Calendar: {exc}")
        db.rollback()

    db.refresh(assignment)
    return assignment


@app.get("/assignments", response_model=list[AssignmentResponse])
def get_assignments(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> list[Assignment]:
    priority_order = case(
        (Assignment.priority == AssignmentPriority.HIGH, 1),
        (Assignment.priority == AssignmentPriority.MEDIUM, 2),
        (Assignment.priority == AssignmentPriority.LOW, 3),
        else_=4,
    )

    query = db.query(Assignment).options(joinedload(Assignment.course))
    query = query.filter(Assignment.user_id == user_id)

    return query.order_by(Assignment.deadline.asc(), priority_order.asc()).all()


@app.get("/statistics/task-insights", response_model=TaskInsightsResponse)
def get_statistics_task_insights(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> TaskInsightsResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return TaskInsightsResponse(**get_task_insights(db, user_id))


@app.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    assignment_id: int,
    db: Session = Depends(get_db),
) -> Assignment:
    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.course))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    return assignment


@app.patch("/assignments/{id}", response_model=AssignmentResponse)
def update_assignment_status(
    id: int,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
) -> Assignment:
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    assignment.set_status(payload.status)
    db.commit()

    try:
        event_id = upsert_assignment_event(db, assignment)
        assignment.calendar_event_id = event_id
        db.commit()
    except ValueError:
        db.rollback()
    except Exception as exc:
        print(f"Failed to sync updated assignment {assignment.id} to Google Calendar: {exc}")
        db.rollback()

    db.refresh(assignment)
    return assignment


@app.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
) -> Assignment:
    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.course))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    user = db.query(User).filter(User.id == payload.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    course = None
    if payload.course_id is not None:
        course = (
            db.query(Course)
            .filter(Course.id == payload.course_id, Course.user_id == payload.user_id)
            .first()
        )

    if course is None and payload.course_name:
        course = (
            db.query(Course)
            .filter(
                Course.user_id == payload.user_id,
                Course.course_name == payload.course_name,
            )
            .first()
        )
        if course is None:
            course = Course(
                user_id=payload.user_id,
                course_name=payload.course_name,
            )
            db.add(course)
            db.flush()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course not found. Please provide a valid course_id or course_name.",
        )

    assignment.title = payload.title
    assignment.description = payload.description
    assignment.deadline = payload.deadline
    assignment.priority = payload.priority
    assignment.status = payload.status
    assignment.tag_color = payload.tag_color
    assignment.user_id = payload.user_id
    assignment.course_id = course.id
    assignment.score = payload.score
    assignment.score_total = payload.score_total
    assignment.difficulty = payload.difficulty
    db.commit()

    try:
        event_id = upsert_assignment_event(db, assignment)
        assignment.calendar_event_id = event_id
        db.commit()
    except ValueError:
        db.rollback()
    except Exception as exc:
        print(f"Failed to sync updated assignment {assignment.id} to Google Calendar: {exc}")
        db.rollback()

    db.refresh(assignment)
    return assignment


@app.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    try:
        delete_assignment_event(db, assignment)
    except ValueError:
        pass

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@app.post("/notifications/send-due-reminders")
def send_due_reminders(
    payload: ReminderSendRequest,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    reminder_service = ReminderService.from_env(
        reminder_type="EMAIL",
        notify_before_days=payload.days_ahead,
    )
    if not reminder_service.validate_email_config():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, "
                "SMTP_USERNAME/SMTP_SENDER_EMAIL, and SMTP_PASSWORD if your server requires login."
            ),
        )

    recipient_email = (payload.recipient_email or user.email).strip().lower()
    now = datetime.utcnow()
    deadline_limit = now + timedelta(days=payload.days_ahead)

    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.user_id == payload.user_id,
            Assignment.status.in_([AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS]),
            Assignment.deadline >= now,
            Assignment.deadline <= deadline_limit,
        )
        .order_by(Assignment.deadline.asc())
        .all()
    )

    sent_assignment_ids: list[int] = []
    failed_assignment_ids: list[int] = []

    for assignment in assignments:
        success = reminder_service.send_reminder(assignment, recipient_email)
        if success:
            sent_assignment_ids.append(assignment.id)
        else:
            failed_assignment_ids.append(assignment.id)

    return {
        "recipient_email": recipient_email,
        "days_ahead": payload.days_ahead,
        "total_candidates": len(assignments),
        "sent_count": len(sent_assignment_ids),
        "failed_count": len(failed_assignment_ids),
        "sent_assignment_ids": sent_assignment_ids,
        "failed_assignment_ids": failed_assignment_ids,
    }


@app.get("/notification-settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> NotificationSettingsResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    setting = get_or_create_notification_setting(db, user_id)
    return serialize_notification_setting(setting)


@app.put("/notification-settings", response_model=NotificationSettingsResponse)
def save_notification_settings(
    payload: NotificationSettingsUpdateRequest,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> NotificationSettingsResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    setting = update_notification_setting(
        db=db,
        user_id=user_id,
        email_enabled=payload.email_enabled,
        reminder_days=payload.reminder_days,
    )
    return serialize_notification_setting(setting)


@app.get("/integrations/google-calendar/connect-url")
def google_calendar_connect_url(user_id: int = Query(...)) -> dict[str, str]:
    try:
        auth_url = get_google_auth_url(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    return {"auth_url": auth_url}


@app.post("/integrations/google-calendar/exchange-code")
def google_calendar_exchange_code(
    payload: dict[str, object],
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user_id = int(payload.get("user_id", 0))
    code = str(payload.get("code", "")).strip()
    if user_id <= 0 or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id and code are required",
        )
    try:
        exchange_code_for_token(db, user_id, code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return {"message": "Google Calendar connected"}


@app.post("/integrations/google-calendar/sync-all")
def google_calendar_sync_all(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    try:
        synced = sync_user_assignments(db, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return {"synced_count": synced}


@app.post("/integrations/google-calendar/disconnect")
def google_calendar_disconnect(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    disconnected_assignments = disconnect_google_calendar(db, user_id)
    return {"disconnected_assignments": disconnected_assignments}


@app.post("/workspace_subjects", response_model=WorkspaceSubjectResponse, status_code=status.HTTP_201_CREATED)
def create_workspace_subject(
    payload: WorkspaceSubjectCreate,
    db: Session = Depends(get_db),
) -> WorkspaceSubject:
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    existing = (
        db.query(WorkspaceSubject)
        .filter(
            WorkspaceSubject.user_id == payload.user_id,
            WorkspaceSubject.name == payload.name,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject already exists for this user",
        )

    subject = WorkspaceSubject(
        user_id=payload.user_id,
        name=payload.name.strip(),
        color=payload.color,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@app.get("/workspace_subjects", response_model=list[WorkspaceSubjectResponse])
def get_workspace_subjects(
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[WorkspaceSubject]:
    query = db.query(WorkspaceSubject)
    if user_id is not None:
        query = query.filter(WorkspaceSubject.user_id == user_id)
    return query.order_by(WorkspaceSubject.name.asc()).all()


@app.patch("/workspace_subjects/{subject_id}", response_model=WorkspaceSubjectResponse)
def update_workspace_subject(
    subject_id: int,
    payload: WorkspaceSubjectUpdate,
    db: Session = Depends(get_db),
) -> WorkspaceSubject:
    subject = db.query(WorkspaceSubject).filter(WorkspaceSubject.id == subject_id).first()
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace subject not found",
        )

    if payload.name is not None:
        subject.name = payload.name.strip()
    if payload.color is not None:
        subject.color = payload.color

    db.commit()
    db.refresh(subject)
    return subject


@app.delete("/workspace_subjects/{subject_id}")
def delete_workspace_subject(
    subject_id: int,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    subject = db.query(WorkspaceSubject).filter(WorkspaceSubject.id == subject_id).first()
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace subject not found",
        )

    linked_assignment_count = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(
            Assignment.user_id == subject.user_id,
            Course.user_id == subject.user_id,
            func.lower(func.trim(Course.course_name))
            == func.lower(func.trim(subject.name)),
        )
        .count()
    )
    if linked_assignment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete workspace subject '{subject.name}' because "
                f"{linked_assignment_count} assignment(s) still use it."
            ),
        )

    db.delete(subject)
    db.commit()
    return {"message": "Workspace subject deleted successfully"}


@app.get("/api/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"message": "MySQL connected successfully"}
