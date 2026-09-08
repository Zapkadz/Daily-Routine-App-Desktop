import type { AnalyticsTask, StreakData } from "../../types/analytics";
import type { Routine, RoutineLog } from "../../types/routine";
import { getDatabase } from "../client";
import { routineRepository } from './routineRepository';

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
      routineRepository.listAll(),
      database.select<RoutineLogRow[]>(
        "SELECT id, routine_id, date, status, completed_at, note FROM routine_logs WHERE date <= ?",
        [today],
      ),
    ]);

    return {
      today,
      tasks: taskRows.map((row) => ({ scheduledDate: row.scheduled_date, status: row.status })),
      routines: routineRows,
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
