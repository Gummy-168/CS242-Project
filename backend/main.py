from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import case, text
from sqlalchemy.orm import Session, joinedload

from database import Base, engine, get_db
from models import Assignment, AssignmentPriority, Course, User
from schemas import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentStatusUpdate,
    LoginRequest,
    RegisterRequest,
)

from fastapi.middleware.cors import CORSMiddleware

# 1. นิยาม lifespan ก่อน
@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

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
@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield



    
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
        difficulty=payload.difficulty,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@app.get("/assignments", response_model=list[AssignmentResponse])
def get_assignments(
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Assignment]:
    priority_order = case(
        (Assignment.priority == AssignmentPriority.HIGH, 1),
        (Assignment.priority == AssignmentPriority.MEDIUM, 2),
        (Assignment.priority == AssignmentPriority.LOW, 3),
        else_=4,
    )
    query = db.query(Assignment).options(joinedload(Assignment.course))
    if user_id is not None:
        query = query.filter(Assignment.user_id == user_id)
    return query.order_by(Assignment.deadline.asc(), priority_order.asc()).all()


@app.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    assignment_id: int,
    db: Session = Depends(get_db),
) -> Assignment:
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
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

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@app.get("/api/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"message": "MySQL connected successfully"}
