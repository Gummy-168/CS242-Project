CREATE DATABASE IF NOT EXISTS cs242db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cs242db;

-- =========================
-- 1) Users
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    account_status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') 
        NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_username (username)
);

-- =========================
-- 2) Courses
-- =========================
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255),
    semester VARCHAR(100),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_courses_user_id (user_id),
    INDEX idx_courses_course_name (course_name)
);

-- =========================
-- 3) Assignments
-- =========================
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    course_id INT NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    deadline DATETIME NOT NULL,

    priority ENUM('LOW', 'MEDIUM', 'HIGH') 
        NOT NULL DEFAULT 'MEDIUM',

    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE') 
        NOT NULL DEFAULT 'PENDING',

    score FLOAT DEFAULT NULL,
    difficulty INT DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_assignment_score
        CHECK (score IS NULL OR (score >= 0 AND score <= 100)),

    CONSTRAINT chk_assignment_difficulty
        CHECK (difficulty IS NULL OR (difficulty BETWEEN 1 AND 5)),

    INDEX idx_assignments_user_id (user_id),
    INDEX idx_assignments_course_id (course_id),
    INDEX idx_assignments_deadline (deadline),
    INDEX idx_assignments_status (status),
    INDEX idx_assignments_priority (priority)
);

-- =========================
-- 4) Reminder Settings
-- เก็บ config การแจ้งเตือนของแต่ละงาน
-- =========================
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,

    assignment_id INT NOT NULL,
    user_id INT NOT NULL,

    reminder_type ENUM('EMAIL', 'CALENDAR', 'BOTH') 
        NOT NULL DEFAULT 'EMAIL',

    notify_before_days INT NOT NULL DEFAULT 1,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    last_sent_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reminders_assignment
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_reminders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_notify_before_days
        CHECK (notify_before_days >= 0),

    INDEX idx_reminders_assignment_id (assignment_id),
    INDEX idx_reminders_user_id (user_id),
    INDEX idx_reminders_enabled (is_enabled)
);

-- =========================
-- 5) Assignment Statistics View
-- ไม่จำเป็นต้องสร้างเป็น table จริง
-- เพราะ count ต่าง ๆ คำนวณจาก assignments ได้เลย
-- =========================
CREATE OR REPLACE VIEW assignment_statistics AS
SELECT
    user_id,
    COUNT(*) AS total_count,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) AS overdue_count
FROM assignments
GROUP BY user_id;

-- =========================
-- 6) Sample Data สำหรับทดสอบระบบ
-- ลบส่วนนี้ได้ถ้าไม่ต้องการ seed data
-- =========================
INSERT INTO users (email, username, password_hash)
VALUES 
('student@example.com', 'student01', 'hashed_password_here');

INSERT INTO courses (user_id, course_name, instructor_name, semester)
VALUES
(1, 'Database System', 'Dr. Example', '2/2025'),
(1, 'Operating System', 'Dr. Example', '2/2025');

INSERT INTO assignments (
    user_id,
    course_id,
    title,
    description,
    deadline,
    priority,
    status,
    score,
    difficulty
)
VALUES
(
    1,
    1,
    'ER Diagram Assignment',
    'Create ER diagram and convert to relational schema',
    '2026-05-10 23:59:00',
    'HIGH',
    'PENDING',
    20,
    4
),
(
    1,
    2,
    'Thread Synchronization Report',
    'Write report about mutex and deadlock',
    '2026-05-15 23:59:00',
    'MEDIUM',
    'IN_PROGRESS',
    15,
    3
);

INSERT INTO reminders (
    assignment_id,
    user_id,
    reminder_type,
    notify_before_days,
    is_enabled
)
VALUES
(1, 1, 'EMAIL', 1, TRUE),
(2, 1, 'BOTH', 2, TRUE);