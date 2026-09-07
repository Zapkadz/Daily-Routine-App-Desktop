ALTER TABLE tasks ADD COLUMN recurrence_source_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_recurrence_source
  ON tasks(recurrence_source_id)
  WHERE recurrence_source_id IS NOT NULL;
