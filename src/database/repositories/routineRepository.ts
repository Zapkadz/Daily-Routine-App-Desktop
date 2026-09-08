import { routineOnDate, routineSnapshot, serializeRoutineRule } from "../../services/routineScheduleService";
import { isValid, parseISO } from 'date-fns';
import { localDateKey } from '../../utils/date';
import type { CreateRoutineInput, Routine, RoutineLog, RoutineStatus } from "../../types/routine";
import { getDatabase } from "../client";

type RoutineRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  frequency_type: Routine["frequencyType"];
  frequency_rule: string;
  reminder_time: string | null;
  is_active: number;
  start_date: string | null;
  created_at: string;
  archived_at: string | null;
  schedule_type: 'custom_dates' | null;
};

type RoutineLogRow = {
  id: string;
  routine_id: string;
  date: string;
  status: RoutineStatus;
  completed_at: string | null;
  note: string | null;
};

function mapRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    frequencyType: row.schedule_type ?? row.frequency_type,
    frequencyRule: row.frequency_rule,
    reminderTime: row.reminder_time,
    isActive: row.is_active === 1,
    startDate: row.start_date ?? row.created_at.slice(0, 10),
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function mapRoutineLog(row: RoutineLogRow): RoutineLog {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    status: row.status,
    completedAt: row.completed_at,
    note: row.note,
  };
}

const routineColumns = `
  id, name, description, icon, color, frequency_type, frequency_rule,
  reminder_time, is_active, start_date, created_at, archived_at, schedule_type
`;

async function withHistory(rows: RoutineRow[]): Promise<Routine[]> {
  const database = await getDatabase();
  const [revisions, occurrences] = await Promise.all([
    database.select<{routine_id: string; effective_date: string; snapshot: string}[]>('SELECT * FROM routine_revisions ORDER BY effective_date'),
    database.select<{routine_id: string; date: string; snapshot: string; removed: number}[]>('SELECT * FROM routine_occurrences ORDER BY date'),
  ]);
  return rows.map(row => ({ ...mapRoutine(row),
    revisions: revisions.filter(item => item.routine_id === row.id).map(item => ({date: item.effective_date, snapshot: JSON.parse(item.snapshot)})),
    occurrences: occurrences.filter(item => item.routine_id === row.id).map(item => ({date: item.date, snapshot: JSON.parse(item.snapshot), removed: item.removed === 1})),
  }));
}

function requireCurrentDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date)) || date < localDateKey()) throw new Error('Choose today or a future date. Historical schedules are read-only.');
}

function validateInput(input: CreateRoutineInput) {
  if (!input.name.trim()) throw new Error('Enter an event name.');
  requireCurrentDate(input.startDate);
  if (!['daily', 'weekdays', 'weekly_target', 'custom_dates'].includes(input.frequencyType)) throw new Error('Choose a valid schedule.');
  if (input.reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime)) throw new Error('Choose a valid time.');
  if (input.frequencyType === 'weekly_target' && (!Number.isInteger(input.weeklyTarget) || input.weeklyTarget < 1 || input.weeklyTarget > 7)) throw new Error('Choose a weekly target from 1 to 7.');
  if (input.frequencyType === 'weekdays' && (!input.weekdays.length || input.weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7))) throw new Error('Choose at least one weekday.');
  if (input.frequencyType === 'custom_dates') {
    if (!input.customDates?.length) throw new Error('Choose at least one custom date.');
    input.customDates.forEach(requireCurrentDate);
    if (input.customDates.some(date => date < input.startDate)) throw new Error('Custom dates must be on or after the start date.');
  }
}

export const routineRepository = {
  async listAll(): Promise<Routine[]> {
    const database = await getDatabase();
    return withHistory(await database.select<RoutineRow[]>(`SELECT ${routineColumns} FROM routines ORDER BY created_at`));
  },
  async listActive(): Promise<Routine[]> {
    const database = await getDatabase();
    const rows = await database.select<RoutineRow[]>(
      `SELECT ${routineColumns}
       FROM routines
       WHERE is_active = 1 AND archived_at IS NULL
       ORDER BY COALESCE(reminder_time, '23:59') ASC, created_at ASC`,
    );
    return withHistory(rows);
  },

  async findById(id: string): Promise<Routine | null> {
    const database = await getDatabase();
    const rows = await database.select<RoutineRow[]>(
      `SELECT ${routineColumns} FROM routines WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? (await withHistory(rows))[0] : null;
  },

  async create(input: CreateRoutineInput): Promise<Routine> {
    validateInput(input);
    const database = await getDatabase();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database.execute(
      `INSERT INTO routines (
        id, name, description, icon, color, frequency_type, frequency_rule,
        reminder_time, is_active, start_date, created_at, archived_at, schedule_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL, ?)`,
      [
        id,
        input.name.trim(),
        input.description?.trim() || null,
        input.icon || null,
        input.color,
        input.frequencyType === 'custom_dates' ? 'weekdays' : input.frequencyType,
        serializeRoutineRule(input),
        input.reminderTime || null,
        input.startDate,
        createdAt,
        input.frequencyType === 'custom_dates' ? 'custom_dates' : null,
      ],
    );
    const routine = await routineRepository.findById(id);
    if (!routine) throw new Error("The routine was created but could not be reloaded.");
    return routine;
  },

  async update(routine: Routine, input: CreateRoutineInput): Promise<Routine> {
    const date = input.effectiveDate ?? localDateKey();
    requireCurrentDate(date);
    if (!input.name.trim()) throw new Error('Enter an event name.');
    const current = await routineRepository.findById(routine.id);
    if (!current || current.archivedAt) throw new Error('This routine is no longer active. Reload your schedule.');
    const database = await getDatabase();
    const base = routineOnDate(current, date);
    const snapshot = { ...routineSnapshot(base), name: input.name.trim(), description: input.description?.trim() || null,
      icon: input.icon || null, color: input.color, reminderTime: input.reminderTime || null };
    if ((input.editScope ?? 'date') === 'date') {
      snapshot.startDate = snapshot.startDate > date ? date : snapshot.startDate;
      await database.execute(`INSERT INTO routine_occurrences(routine_id,date,snapshot,removed) VALUES (?,?,?,0)
        ON CONFLICT(routine_id,date) DO UPDATE SET snapshot=excluded.snapshot,removed=0`, [routine.id, date, JSON.stringify(snapshot)]);
    } else {
      validateInput(input);
      Object.assign(snapshot, {frequencyType: input.frequencyType, frequencyRule: serializeRoutineRule(input), startDate: date});
      await database.execute(`INSERT INTO routine_revisions(routine_id,effective_date,snapshot) VALUES (?,?,?)
        ON CONFLICT(routine_id,effective_date) DO UPDATE SET snapshot=excluded.snapshot`, [routine.id, date, JSON.stringify(snapshot)]);
    }
    const updated = await routineRepository.findById(routine.id);
    if (!updated) throw new Error("The routine was updated but could not be reloaded.");
    return updated;
  },

  async removeDate(routine: Routine, date: string, removed = true): Promise<Routine> {
    requireCurrentDate(date);
    const current = await routineRepository.findById(routine.id);
    if (!current || current.archivedAt) throw new Error('This routine is no longer active.');
    const database = await getDatabase();
    const snapshot = routineSnapshot(routineOnDate(current, date));
    await database.execute(`INSERT INTO routine_occurrences(routine_id,date,snapshot,removed) VALUES (?,?,?,?)
      ON CONFLICT(routine_id,date) DO UPDATE SET removed=excluded.removed`, [routine.id, date, JSON.stringify(snapshot), removed ? 1 : 0]);
    return (await routineRepository.findById(routine.id))!;
  },

  async archive(routine: Routine): Promise<void> {
    const database = await getDatabase();
    await database.execute(
      "UPDATE routines SET is_active = 0, archived_at = ? WHERE id = ?",
      [new Date().toISOString(), routine.id],
    );
  },

  async deletePermanently(routine: Routine): Promise<void> {
    const database = await getDatabase();
    await database.execute("DELETE FROM routines WHERE id = ?", [routine.id]);
  },

  async listLogsForDate(date: string): Promise<RoutineLog[]> {
    const database = await getDatabase();
    const rows = await database.select<RoutineLogRow[]>(
      `SELECT id, routine_id, date, status, completed_at, note
       FROM routine_logs WHERE date = ?`,
      [date],
    );
    return rows.map(mapRoutineLog);
  },

  async listLogsBetween(startDate: string, endDate: string): Promise<RoutineLog[]> {
    const database = await getDatabase();
    const rows = await database.select<RoutineLogRow[]>(
      `SELECT id, routine_id, date, status, completed_at, note
       FROM routine_logs
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [startDate, endDate],
    );
    return rows.map(mapRoutineLog);
  },

  async setLogStatus(routineId: string, date: string, status: RoutineStatus): Promise<RoutineLog> {
    const database = await getDatabase();
    const completedAt = status === "completed" ? new Date().toISOString() : null;
    const id = crypto.randomUUID();
    await database.execute(
      `INSERT INTO routine_logs (id, routine_id, date, status, completed_at, note)
       VALUES (?, ?, ?, ?, ?, NULL)
       ON CONFLICT(routine_id, date) DO UPDATE SET
         status = excluded.status,
         completed_at = excluded.completed_at`,
      [id, routineId, date, status, completedAt],
    );
    const rows = await database.select<RoutineLogRow[]>(
      `SELECT id, routine_id, date, status, completed_at, note
       FROM routine_logs WHERE routine_id = ? AND date = ? LIMIT 1`,
      [routineId, date],
    );
    if (!rows[0]) throw new Error("The routine status could not be reloaded.");
    return mapRoutineLog(rows[0]);
  },
};
