-- Keep the original table/foreign keys intact. Legacy frequency_type retains
-- its CHECK constraint; schedule_type adds the new mode without table rebuild.
ALTER TABLE routines ADD COLUMN schedule_type TEXT CHECK (schedule_type IS NULL OR schedule_type = 'custom_dates');
CREATE TABLE routine_revisions (
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
  PRIMARY KEY(routine_id, effective_date)
);
CREATE TABLE routine_occurrences (
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
  removed INTEGER NOT NULL DEFAULT 0 CHECK(removed IN (0,1)),
  PRIMARY KEY(routine_id, date)
);
CREATE INDEX idx_routine_occurrences_date ON routine_occurrences(date);
INSERT INTO routine_revisions(routine_id,effective_date,snapshot)
SELECT id,'0001-01-01',json_object('name',name,'description',description,'icon',icon,'color',color,
  'frequencyType',frequency_type,'frequencyRule',frequency_rule,'reminderTime',reminder_time,
  'startDate',COALESCE(start_date,substr(created_at,1,10))) FROM routines;
CREATE TRIGGER routine_initial_revision AFTER INSERT ON routines BEGIN
  INSERT INTO routine_revisions(routine_id,effective_date,snapshot) VALUES (NEW.id,'0001-01-01',
    json_object('name',NEW.name,'description',NEW.description,'icon',NEW.icon,'color',NEW.color,
      'frequencyType',COALESCE(NEW.schedule_type,NEW.frequency_type),'frequencyRule',NEW.frequency_rule,
      'reminderTime',NEW.reminder_time,'startDate',NEW.start_date));
END;
-- One SQL statement atomically replaces the planned series from this date.
-- Later single-date choices are preserved; the effective date adopts the new series.
CREATE TRIGGER routine_revision_future_insert AFTER INSERT ON routine_revisions BEGIN
  DELETE FROM routine_revisions WHERE routine_id=NEW.routine_id AND effective_date>NEW.effective_date;
  DELETE FROM routine_occurrences WHERE routine_id=NEW.routine_id AND date=NEW.effective_date;
END;
CREATE TRIGGER routine_revision_future_update AFTER UPDATE ON routine_revisions BEGIN
  DELETE FROM routine_revisions WHERE routine_id=NEW.routine_id AND effective_date>NEW.effective_date;
  DELETE FROM routine_occurrences WHERE routine_id=NEW.routine_id AND date=NEW.effective_date;
END;
