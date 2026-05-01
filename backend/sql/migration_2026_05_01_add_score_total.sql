-- Migration: Add score_total column to assignments table
-- Date: 2026-05-01

ALTER TABLE assignments ADD COLUMN score_total FLOAT NULL DEFAULT NULL COMMENT 'Maximum score for the assignment';

-- Add index if needed for performance
CREATE INDEX idx_assignments_score_total ON assignments(score_total);

-- Update existing records to ensure data consistency
-- If score exists but score_total is null, set score_total to 100 (assuming score was out of 100)
UPDATE assignments SET score_total = 100 WHERE score IS NOT NULL AND score_total IS NULL;
