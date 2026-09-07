import { eachDayOfInterval, endOfYear, format, min, parseISO, startOfMonth, startOfWeek, startOfYear, subDays } from "date-fns";
import type { AnalyticsSummary, DailyStreakState, StreakData } from "../types/analytics";
import { isRoutineActiveOnDate, isRoutineRequiredOnDate } from "./routineScheduleService";
import { calculateStreaks } from "./streakService";

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

function completionRate(days: DailyStreakState[]) {
  return percentage(
    days.reduce((sum, day) => sum + day.taskCompleted + day.routineCompleted, 0),
    days.reduce((sum, day) => sum + day.taskTotal + day.routineTotal, 0),
  );
}

export function calculateAnalytics(data: StreakData, year: number): AnalyticsSummary {
  const streaks = calculateStreaks(data);
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = min([endOfYear(yearStart), parseISO(data.today)]);
  const yearDays = streaks.days.filter((day) => Number(day.date.slice(0, 4)) === year);
  const trackedDays = yearDays.filter((day) => day.hasData);
  const plannedDays = yearDays.filter((day) => day.qualifiesForPlanning);
  const completedDays = plannedDays.filter((day) => day.qualifiesForCompletion);
  const today = parseISO(data.today);
  const last7 = streaks.days.filter((day) => day.date >= format(subDays(today, 6), "yyyy-MM-dd"));
  const last30 = streaks.days.filter((day) => day.date >= format(subDays(today, 29), "yyyy-MM-dd"));
  const completedTasks = data.tasks.filter((task) => task.status === "completed");
  const yearPrefix = `${year}-`;
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const logs = new Map(data.routineLogs.map((log) => [`${log.routineId}:${log.date}`, log.status]));
  const dateKeys = yearEnd < yearStart ? [] : eachDayOfInterval({ start: yearStart, end: yearEnd }).map((date) => format(date, "yyyy-MM-dd"));

  const routineStats = data.routines
    .filter((routine) => isRoutineActiveOnDate(routine, format(yearStart, "yyyy-MM-dd")) || dateKeys.some((date) => isRoutineActiveOnDate(routine, date)))
    .map((routine) => {
      let expected = 0;
      let completed = 0;
      for (const date of dateKeys) {
        if (!isRoutineActiveOnDate(routine, date)) continue;
        const status = logs.get(`${routine.id}:${date}`);
        const included = isRoutineRequiredOnDate(routine, date) || (routine.frequencyType === "weekly_target" && status !== undefined);
        if (!included || status === "exempted") continue;
        expected += 1;
        if (status === "completed") completed += 1;
      }
      return { id: routine.id, name: routine.name, color: routine.color, completed, expected, rate: percentage(completed, expected) };
    })
    .sort((left, right) => right.rate - left.rate || left.name.localeCompare(right.name));

  return {
    year,
    activeRoutines: data.routines.filter((routine) => isRoutineActiveOnDate(routine, data.today)).length,
    trackedDays: trackedDays.length,
    plannedDays: plannedDays.length,
    completedDays: completedDays.length,
    planningRate: percentage(plannedDays.length, trackedDays.length),
    completionRate: completionRate(yearDays),
    last7CompletionRate: completionRate(last7),
    last30CompletionRate: completionRate(last30),
    tasksCompleted: completedTasks.filter((task) => task.scheduledDate.startsWith(yearPrefix)).length,
    tasksCompletedThisWeek: completedTasks.filter((task) => task.scheduledDate >= weekStart && task.scheduledDate <= data.today).length,
    tasksCompletedThisMonth: completedTasks.filter((task) => task.scheduledDate >= monthStart && task.scheduledDate <= data.today).length,
    streaks,
    yearDays,
    routineStats,
  };
}
