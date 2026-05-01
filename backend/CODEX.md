# CODEX.md

## Project Name

Assignment Management System  
A centralized assignment tracking system for students.

---

## Project Overview

This project is a web application that helps students manage assignments from multiple courses in one place.

Students can create, edit, delete, search, filter, and track assignments based on course, deadline, priority, difficulty, score, and status.

The main goal of this system is to reduce missed deadlines, improve time management, and help students clearly see all remaining assignments in a single dashboard.

---

## Problem Statement

Students often receive assignments from many different courses and platforms. This causes several problems:

1. It is difficult to prioritize assignments when deadlines overlap.
2. Assignments are scattered across multiple places such as LMS, Google Classroom, email, chat groups, or course websites.
3. Students may forget to submit assignments because there is no centralized reminder system.
4. Students cannot clearly see all remaining assignments in one place.
5. Planning study time becomes difficult when assignment difficulty and deadlines are not organized.

---

## Target Users

The main users of this system are:

- Students who need to manage assignments from multiple courses.
- Students who want to view all deadlines in one dashboard.
- Students who need reminders before assignment deadlines.
- Students who want to search, filter, and prioritize assignments easily.

---

## Main Benefits

1. Reduces the chance of missing assignment deadlines.
2. Helps students plan their time more effectively.
3. Shows all assignments from different courses in one dashboard.
4. Allows users to search and filter assignments by course, status, deadline, priority, or difficulty.
5. Supports better assignment prioritization based on deadline and importance.

---

## Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- PyMySQL

### Database

- MySQL

### Development and Deployment

- Docker
- Docker Compose
- Uvicorn

---

## Actual Project Structure

```text
BACKEND/
│
├── models/
│   ├── __init__.py
│   ├── assignment.py
│   ├── course.py
│   └── user.py
│
├── services/
│   ├── __init__.py
│   ├── assignment_manager.py
│   ├── assignment_statistics.py
│   └── reminder_service.py
│
├── sql/
│   └── init.sql
│
├── myenv/
│
├── .codex/
├── .env
├── .env.example
├── .gitignore
├── CODEX.md
├── database.py
├── docker-compose.yml
├── Dockerfile
├── main.py
├── README.md
├── requirements.txt
└── schemas.py

Folder and File Responsibilities
Folder / File	Responsibility
models/	Contains SQLAlchemy database models
services/	Contains business logic and feature logic
sql/init.sql	Initializes MySQL database tables
database.py	Handles database connection
main.py	Main FastAPI application and API routes
schemas.py	Contains Pydantic request and response schemas
.env	Stores local environment variables
.env.example	Example environment configuration
Dockerfile	Defines backend Docker image
docker-compose.yml	Runs backend and MySQL services
CODEX.md	Project guide for developers and AI coding assistants
README.md	General project documentation
Core System Concepts

The system is based on the following main concepts:

User
Course
Assignment
Assignment Status
Assignment Statistics
Reminder Service
Core Features
1. User Management

Users should be able to:

Register an account.
Log in with email and password.
Log out.
Update username.
Update email.
Validate account status.

Related table:

users

Related model:

User
2. Course Management

Users should be able to:

Create a course.
View all courses.
Edit course information.
Delete a course.
Assign assignments to a course.

Related table:

courses

Related model:

Course
3. Assignment Management

Users should be able to:

Create a new assignment.
Edit an existing assignment.
Delete an assignment.
View assignment details.
Mark an assignment as completed.
Update assignment status.
Update assignment priority.
Set deadline, score, and difficulty.

Related table:

assignments

Related model:

Assignment

Recommended assignment fields:

assignment_id
user_id
course_id
title
description
deadline
priority
status
score
difficulty
created_at
updated_at
4. Dashboard

The dashboard should show:

Total assignments.
Pending assignments.
In-progress assignments.
Completed assignments.
Overdue assignments.
Upcoming assignments.
Assignments sorted by deadline.
Assignments grouped by course.

Related database view:

assignment_statistics
5. Search and Filter

Users should be able to search and filter assignments by:

Keyword
Course
Status
Priority
Difficulty
Deadline
Remaining days

Example filters:

status = PENDING
course_id = 1
priority = HIGH
difficulty >= 4
deadline before this week
6. Deadline Tracking

The system should be able to:

Detect upcoming assignments.
Detect overdue assignments.
Calculate remaining days.
Sort assignments by deadline.
Highlight urgent assignments.

Suggested rules:

If deadline < current datetime and status is not COMPLETED:
    status should be OVERDUE

If deadline is within 3 days:
    assignment should be marked as urgent
7. Reminder System

The reminder system should support:

Email reminder
Calendar sync
Notification scheduling
Reminder before deadline

Related table:

reminders

Related service:

ReminderService

Recommended reminder fields:

reminder_id
assignment_id
user_id
reminder_type
notify_before_days
is_enabled
last_sent_at
created_at
updated_at
8. Calendar View

The system should support a calendar-style view for assignments.

Users should be able to:

View assignments by month.
View assignments by week.
See deadlines on a calendar.
Sync assignment deadlines with external calendar APIs in the future.

Possible external APIs:

Google Calendar API
Email API
Database Design

The database should include the following main tables:

users

Stores user account information.

courses

Stores course information for each user.

assignments

Stores assignment information.

reminders

Stores reminder settings for assignments.

assignment_statistics

This should be implemented as a SQL view instead of a real table because the values can be calculated from the assignments table.

Recommended Database Rules
Each user can have many courses.
Each user can have many assignments.
Each course can have many assignments.
Each assignment belongs to one user.
Each assignment belongs to one course.
Each assignment can have reminder settings.
Statistics should be calculated from actual assignment data, not stored manually.
Status Values

Use the following assignment status values:

PENDING
IN_PROGRESS
COMPLETED
OVERDUE
Priority Values

Use the following priority values:

LOW
MEDIUM
HIGH
Difficulty Values

Use integer values from 1 to 5:

1 = Very Easy
2 = Easy
3 = Medium
4 = Hard
5 = Very Hard
API Design Guidelines

All API routes should follow REST-style naming.

Recommended route structure:

/api/auth
/api/users
/api/courses
/api/assignments
/api/reminders
/api/statistics
Suggested API Endpoints
Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
Users
GET    /api/users/me
PUT    /api/users/me
DELETE /api/users/me
Courses
GET    /api/courses
GET    /api/courses/{course_id}
POST   /api/courses
PUT    /api/courses/{course_id}
DELETE /api/courses/{course_id}
Assignments
GET    /api/assignments
GET    /api/assignments/{assignment_id}
POST   /api/assignments
PUT    /api/assignments/{assignment_id}
DELETE /api/assignments/{assignment_id}
PATCH  /api/assignments/{assignment_id}/status
PATCH  /api/assignments/{assignment_id}/complete
Search and Filter
GET /api/assignments/search?keyword=database
GET /api/assignments/filter?status=PENDING
GET /api/assignments/filter?course_id=1
GET /api/assignments/filter?priority=HIGH
GET /api/assignments/upcoming
GET /api/assignments/overdue
Statistics
GET /api/statistics
GET /api/statistics/summary
GET /api/statistics/remaining
Reminders
GET    /api/reminders
POST   /api/reminders
PUT    /api/reminders/{reminder_id}
DELETE /api/reminders/{reminder_id}
POST   /api/reminders/send
Backend Architecture

The backend should follow this structure:

Route Layer
↓
Service Layer
↓
Model / Database Layer
Route Layer

The route layer is responsible for:

Receiving HTTP requests.
Validating input using Pydantic schemas.
Calling service functions.
Returning API responses.
Handling HTTP errors.

Example files:

main.py

In the future, routes may be separated into:

routes/auth_routes.py
routes/course_routes.py
routes/assignment_routes.py
routes/reminder_routes.py
Service Layer

The service layer is responsible for:

Business logic.
Assignment calculation.
Deadline checking.
Reminder scheduling.
Statistics calculation.
Search and filter logic.
Ownership validation.

Example files:

services/assignment_manager.py
services/assignment_statistics.py
services/reminder_service.py
Model / Database Layer

The model layer is responsible for:

Defining database tables.
Defining relationships.
Communicating with MySQL through SQLAlchemy.

Example files:

models/user.py
models/course.py
models/assignment.py
Naming Conventions
Files

Use lowercase file names with underscores.

Good examples:

assignment_manager.py
reminder_service.py
assignment_statistics.py

Bad examples:

AssignmentManager.py
ReminderService.py
AssignmentStats.py
Database Tables

Use lowercase plural names.

Good examples:

users
courses
assignments
reminders
Python Classes

Use PascalCase.

Examples:

User
Course
Assignment
ReminderService
AssignmentManager
Python Functions

Use snake_case.

Examples:

create_assignment()
edit_assignment()
delete_assignment()
filter_by_status()
get_upcoming_assignments()
Error Handling Guidelines

Use proper HTTP status codes.

Examples:

200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error

Common rules:

Return 404 Not Found when a resource does not exist.
Return 400 Bad Request when input data is invalid.
Return 401 Unauthorized when the user is not logged in.
Return 403 Forbidden when the user tries to access data that does not belong to them.
Return 409 Conflict when an email or unique value already exists.
Do not expose raw database errors to users.
Validation Rules
User
Email must be unique.
Email must be valid.
Password should be hashed before storing.
Username should not be empty.
Account status should be valid.
Course
Course name should not be empty.
Course must belong to a user.
Instructor name is optional.
Semester is optional.
Assignment
Title should not be empty.
Deadline must be a valid datetime.
Status must be one of the allowed status values.
Priority must be one of the allowed priority values.
Difficulty must be between 1 and 5.
Score should be between 0 and 100 if provided.
Assignment must belong to a user.
Assignment should belong to a course.
Reminder
Reminder must belong to an assignment.
Reminder must belong to a user.
notify_before_days must be greater than or equal to 0.
Reminder type must be valid.
Disabled reminders should not send notifications.
Security Guidelines
Never store plain text passwords.
Always hash passwords before saving them.
Do not commit .env files to GitHub.
Store secrets in environment variables.
Validate all user inputs.
Prevent users from accessing assignments that do not belong to them.
Use authentication before accessing private data.
Do not expose API keys in frontend code.
Do not expose raw SQL errors to users.
Environment Variables

Recommended .env variables:

DB_HOST=db
DB_PORT=3306
DB_NAME=cs242db
DB_USER=root
DB_PASSWORD=123456789

SECRET_KEY=replace_with_secure_secret
ACCESS_TOKEN_EXPIRE_MINUTES=60

EMAIL_API_KEY=
SENDER_EMAIL=
Git Ignore Rules

The following files and folders should not be pushed to GitHub:

myenv/
__pycache__/
.env
*.pyc
.DS_Store

Only .env.example should be pushed.

Docker Guidelines

The MySQL container should automatically run init.sql when the database volume is created for the first time.

Recommended volume mount:

volumes:
  - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

Important note:

If the MySQL volume already exists, Docker will not run init.sql again automatically.

To reset the database:

docker compose down -v
docker compose up --build

Use this only when it is safe to delete existing database data.

Future Feature Expansion Guide

This section explains how to add new features in the future without breaking the current system.

General Rule for Adding New Features

When adding a new feature, follow this structure:

1. Update database design
2. Update SQLAlchemy model
3. Update Pydantic schema
4. Add service logic
5. Add API route
6. Test with Swagger UI
7. Connect to frontend
8. Update documentation
Step 1: Understand the Feature

Before coding, clearly identify:

What problem the feature solves.
Which user will use it.
What input is required.
What output should be returned.
Which table or model is affected.
Whether it needs a new table or just a new column.

Example:

Feature: Add assignment category

Input:
- category_name
- assignment_id

Output:
- Assignment with category

Affected tables:
- assignments
- categories
Step 2: Update Database Design

If the feature requires new data, update the database.

Possible changes:

Add a new table.
Add a new column.
Add a new relationship.
Add an index if the data will be searched often.
Add a foreign key if the data belongs to another table.

Example:

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
Step 3: Update SQLAlchemy Model

Create or update the model inside the models/ folder.

Example:

models/category.py

The model should match the database table.

Step 4: Update Pydantic Schema

Create request and response schemas inside schemas.py or inside a future schemas/ folder.

Example schemas:

CategoryCreate
CategoryUpdate
CategoryResponse

Schemas should be used for:

Request body validation.
API response format.
Preventing invalid data from entering the system.
Step 5: Add Service Logic

Add business logic inside the services/ folder.

Example:

services/category_service.py

The service should handle:

Creating data.
Updating data.
Deleting data.
Searching data.
Validating ownership.
Returning processed results.

Avoid putting too much logic directly inside main.py.

Step 6: Add API Routes

Add routes in main.py or a separate router file.

Recommended route:

/api/categories

Example endpoints:

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{category_id}
DELETE /api/categories/{category_id}
Step 7: Test the Feature

Test using:

Swagger UI at /docs
Postman
Frontend fetch request
Direct database query

Example database checks:

SHOW TABLES;
SELECT * FROM categories;
Step 8: Connect to Frontend

After the API works, connect it to the frontend.

Frontend should handle:

Form input.
API request.
Loading state.
Error message.
Success message.
UI update after data changes.
Step 9: Update Documentation

After adding a new feature, update:

CODEX.md
README.md
.env.example
sql/init.sql

If the feature affects API routes, also update the API endpoint section.

Suggested Future Features

The following features can be added later.

1. Assignment Category

Allow users to group assignments by category.

Examples:

Homework
Project
Exam
Presentation
Report
Lab

Possible table:

categories

Possible files:

models/category.py
services/category_service.py

Possible routes:

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{category_id}
DELETE /api/categories/{category_id}
2. Tags

Allow users to add multiple tags to an assignment.

Examples:

urgent
group-work
coding
reading
research

Possible tables:

tags
assignment_tags

Possible files:

models/tag.py
services/tag_service.py

Possible routes:

GET    /api/tags
POST   /api/tags
DELETE /api/tags/{tag_id}
POST   /api/assignments/{assignment_id}/tags
DELETE /api/assignments/{assignment_id}/tags/{tag_id}
3. Notification History

Store a history of sent reminders.

Possible table:

notification_logs

Useful fields:

notification_id
assignment_id
user_id
sent_at
notification_type
status
error_message

Possible file:

services/notification_log_service.py
4. Calendar Integration

Allow assignment deadlines to sync with Google Calendar.

Possible API:

Google Calendar API

Possible fields:

google_event_id
calendar_sync_status
last_synced_at

Possible table:

calendar_events

Possible file:

services/calendar_service.py
5. Email Notification

Send email reminders before assignment deadlines.

Possible service:

EmailService

Possible fields:

email_status
last_email_sent_at

Possible file:

services/email_service.py
6. Priority Recommendation

Automatically recommend assignment priority based on:

Deadline
Difficulty
Score
Remaining days

Example rule:

If deadline is within 2 days and difficulty >= 4:
    priority = HIGH

Possible file:

services/priority_service.py
7. Workload Summary

Show how heavy the workload is for each week.

Example output:

This week:
- 5 assignments total
- 2 high priority assignments
- 1 overdue assignment

Possible route:

GET /api/statistics/workload

Possible file:

services/workload_service.py
8. Progress Tracking

Show progress based on assignment status.

Example:

Completed: 4
Remaining: 6
Progress: 40%

Possible route:

GET /api/statistics/progress
9. File Attachment

Allow users to attach files or links to each assignment.

Possible table:

assignment_files

Useful fields:

file_id
assignment_id
file_name
file_url
uploaded_at

Possible file:

services/file_service.py
10. Collaboration / Group Assignment

Allow multiple users to share the same assignment.

Possible table:

assignment_members

Useful fields:

assignment_id
user_id
role

Possible roles:

OWNER
EDITOR
VIEWER

Possible file:

services/collaboration_service.py
11. Activity Log

Track important user actions.

Examples:

Created assignment
Updated deadline
Marked assignment as completed
Deleted course

Possible table:

activity_logs

Useful fields:

log_id
user_id
action
target_type
target_id
created_at
12. Soft Delete

Instead of permanently deleting data, mark it as deleted.

Possible fields:

is_deleted
deleted_at

This can be added to:

assignments
courses
reminders
Recommended Feature Priority

For the current version, focus on these features first:

1. User login and register
2. Course management
3. Assignment CRUD
4. Dashboard summary
5. Search and filter
6. Deadline tracking
7. Reminder settings

After the main system works, add:

1. Calendar view
2. Email notification
3. Assignment category
4. Tags
5. Priority recommendation
6. Workload summary
7. File attachment
8. Collaboration
Development Checklist

Before considering a feature complete, check the following:

[ ] Database table or column is ready
[ ] SQLAlchemy model is ready
[ ] Pydantic schema is ready
[ ] Service logic is ready
[ ] API route is ready
[ ] Error handling is included
[ ] Ownership validation is included
[ ] API tested in Swagger UI
[ ] Frontend connected
[ ] Documentation updated
API Response Format

Recommended success response:

{
  "success": true,
  "message": "Assignment created successfully",
  "data": {}
}

Recommended error response:

{
  "success": false,
  "message": "Assignment not found",
  "error": "NOT_FOUND"
}
Notes for AI Coding Assistants

When generating or modifying code for this project:

Follow the existing folder structure.
Do not rewrite the whole project unless requested.
Keep business logic inside services/.
Keep database models inside models/.
Keep request and response validation inside schemas.py.
Use FastAPI and SQLAlchemy style consistently.
Do not hardcode database credentials.
Do not expose .env values.
Add comments only when they help explain important logic.
Make sure new features can be extended later.