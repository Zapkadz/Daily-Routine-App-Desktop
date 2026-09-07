import type { AnalyticsTask, StreakData } from "../../types/analytics";
import type { Routine, RoutineLog } from "../../types/routine";
import { getDatabase } from "../client";

type AnalyticsTaskRow = { scheduled_date: string; status: AnalyticsTask["status"] };
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
  status: RoutineLog["status"];
  completed_at: string | null;
  note: string | null;
};

export const analyticsRepository = {
  async loadStreakData(today: string): Promise<StreakData> {
    const database = await getDatabase();
    const [taskRows, routineRows, logRows] = await Promise.all([
      database.select<AnalyticsTaskRow[]>("SELECT scheduled_date, status FROM tasks WHERE scheduled_date <= ?", [today]),
      database.select<RoutineRow[]>(
        `SELECT id, name, description, icon, color, frequency_type, frequency_rule,
                reminder_time, is_active, start_date, created_at, archived_at
         FROM routines WHERE COALESCE(start_date, substr(created_at, 1, 10)) <= ?`,
        [today],
      ),
      database.select<RoutineLogRow[]>(
        "SELECT id, routine_id, date, status, completed_at, note FROM routine_logs WHERE date <= ?",
        [today],
      ),
    ]);

    return {
      today,
      tasks: taskRows.map((row) => ({ scheduledDate: row.scheduled_date, status: row.status })),
      routines: routineRows.map((row) => ({
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
      })),
      routineLogs: logRows.map((row) => ({
        id: row.id,
        routineId: row.routine_id,
        date: row.date,
        status: row.status,
        completedAt: row.completed_at,
        note: row.note,
      })),
    };
  },
};
