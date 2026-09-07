ALTER TABLE routines ADD COLUMN start_date TEXT;

UPDATE routines
SET start_date = substr(created_at, 1, 10)
WHERE start_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_routines_start_date ON routines(start_date);
