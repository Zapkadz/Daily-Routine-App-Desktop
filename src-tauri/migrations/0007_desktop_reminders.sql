CREATE TABLE reminder_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  sound INTEGER NOT NULL DEFAULT 1 CHECK(sound IN (0,1)),
  background INTEGER NOT NULL DEFAULT 1 CHECK(background IN (0,1))
);
INSERT INTO reminder_settings(id) VALUES(1);
CREATE TABLE reminder_deliveries (
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('claimed','sent','failed')),
  PRIMARY KEY(routine_id,date)
);
ALTER TABLE routines ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK(reminder_enabled IN (0,1));
DROP TRIGGER routine_initial_revision;
CREATE TRIGGER routine_initial_revision AFTER INSERT ON routines BEGIN
  INSERT INTO routine_revisions(routine_id,effective_date,snapshot) VALUES (NEW.id,'0001-01-01',
    json_object('name',NEW.name,'description',NEW.description,'icon',NEW.icon,'color',NEW.color,
      'frequencyType',COALESCE(NEW.schedule_type,NEW.frequency_type),'frequencyRule',NEW.frequency_rule,
      'reminderTime',NEW.reminder_time,'reminderEnabled',json(CASE WHEN NEW.reminder_enabled=1 THEN 'true' ELSE 'false' END),
      'startDate',NEW.start_date));
END;
