USE cs242db;

-- 1) Add assignments.calendar_event_id if missing
SET @has_calendar_event_id := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'assignments'
      AND COLUMN_NAME = 'calendar_event_id'
);

SET @sql_add_calendar_event_id := IF(
    @has_calendar_event_id = 0,
    'ALTER TABLE assignments ADD COLUMN calendar_event_id VARCHAR(255) NULL',
    'SELECT ''assignments.calendar_event_id already exists'' AS message'
);
PREPARE stmt FROM @sql_add_calendar_event_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Add index on assignments.calendar_event_id if missing
SET @has_assignments_calendar_event_idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'assignments'
      AND INDEX_NAME = 'idx_assignments_calendar_event_id'
);

SET @sql_add_assignments_calendar_event_idx := IF(
    @has_assignments_calendar_event_idx = 0,
    'CREATE INDEX idx_assignments_calendar_event_id ON assignments(calendar_event_id)',
    'SELECT ''idx_assignments_calendar_event_id already exists'' AS message'
);
PREPARE stmt FROM @sql_add_assignments_calendar_event_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Create google_calendar_tokens table
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'Bearer',
    scope TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_google_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_google_tokens_user_id (user_id)
);
