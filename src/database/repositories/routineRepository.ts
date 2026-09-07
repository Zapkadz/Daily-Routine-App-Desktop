import { serializeRoutineRule } from "../../services/routineScheduleService";
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
    frequencyType: row.frequency_type,
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
  reminder_time, is_active, start_date, created_at, archived_at
`;

export const routineRepository = {
  async listActive(): Promise<Routine[]> {
    const database = await getDatabase();
    const rows = await database.select<RoutineRow[]>(
      `SELECT ${routineColumns}
       FROM routines
       WHERE is_active = 1 AND archived_at IS NULL
       ORDER BY COALESCE(reminder_time, '23:59') ASC, created_at ASC`,
    );
    return rows.map(mapRoutine);
  },

  async findById(id: string): Promise<Routine | null> {
    const database = await getDatabase();
    const rows = await database.select<RoutineRow[]>(
      `SELECT ${routineColumns} FROM routines WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? mapRoutine(rows[0]) : null;
  },

  async create(input: CreateRoutineInput): Promise<Routine> {
    const database = await getDatabase();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database.execute(
      `INSERT INTO routines (
        id, name, description, icon, color, frequency_type, frequency_rule,
        reminder_time, is_active, start_date, created_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [
        id,
        input.name.trim(),
        input.description?.trim() || null,
        input.icon || null,
        input.color,
        input.frequencyType,
        serializeRoutineRule(input),
        input.reminderTime || null,
        input.startDate,
        createdAt,
      ],
    );
    const routine = await routineRepository.findById(id);
    if (!routine) throw new Error("The routine was created but could not be reloaded.");
    return routine;
  },

  async update(routine: Routine, input: CreateRoutineInput): Promise<Routine> {
    const database = await getDatabase();
    await database.execute(
      `UPDATE routines
       SET name = ?, description = ?, icon = ?, color = ?, frequency_type = ?,
           frequency_rule = ?, reminder_time = ?, start_date = ?
       WHERE id = ?`,
      [
        input.name.trim(),
        input.description?.trim() || null,
        input.icon || null,
        input.color,
        input.frequencyType,
        serializeRoutineRule(input),
        input.reminderTime || null,
        input.startDate,
        routine.id,
      ],
    );
    const updated = await routineRepository.findById(routine.id);
    if (!updated) throw new Error("The routine was updated but could not be reloaded.");
    return updated;
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
