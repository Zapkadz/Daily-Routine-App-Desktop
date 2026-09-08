import { eachDayOfInterval, format, parseISO } from "date-fns";
import { isRoutineActiveOnDate, isRoutineRequiredOnDate, routineOnDate } from "./routineScheduleService";
import type { DailyStreakState, StreakData, StreakSummary } from "../types/analytics";

function currentStreak(days: DailyStreakState[], field: "qualifiesForPlanning" | "qualifiesForCompletion") {
  if (days.length === 0) return 0;
  let index = days.length - 1;
  if (!days[index][field]) index -= 1;
  let streak = 0;
  while (index >= 0 && days[index][field]) {
    streak += 1;
    index -= 1;
  }
  return streak;
}

function longestStreak(days: DailyStreakState[], field: "qualifiesForPlanning" | "qualifiesForCompletion") {
  let current = 0;
  let longest = 0;
  for (const day of days) {
    current = day[field] ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function calculateStreaks(data: StreakData): StreakSummary {
  const candidateDates = [
    ...data.tasks.map((task) => task.scheduledDate),
    ...data.routines.map((routine) => routine.startDate),
    ...data.routines.flatMap(routine => (routine.revisions ?? []).filter(item => item.date !== '0001-01-01').map(item => item.date)),
    ...data.routines.flatMap(routine => (routine.occurrences ?? []).filter(item => !item.removed).map(item => item.date)),
    ...data.routineLogs.map((log) => log.date),
  ].filter((date) => date <= data.today);

  if (candidateDates.length === 0) {
    return { planningCurrent: 0, planningLongest: 0, completionCurrent: 0, completionLongest: 0, days: [] };
  }

  const firstDate = candidateDates.sort()[0];
  const dateKeys = eachDayOfInterval({ start: parseISO(firstDate), end: parseISO(data.today) })
    .map((date) => format(date, "yyyy-MM-dd"));
  const logMap = new Map(data.routineLogs.map((log) => [`${log.routineId}:${log.date}`, log]));
  const routineMap = new Map(data.routines.map((routine) => [routine.id, routine]));

  const days = dateKeys.map<DailyStreakState>((date) => {
    const allTasks = data.tasks.filter((task) => task.scheduledDate === date);
    const tasks = allTasks.filter((task) => task.status !== "cancelled");
    const requiredRoutines = data.routines.filter((routine) => isRoutineRequiredOnDate(routine, date));
    const flexibleLogs = data.routineLogs.filter((log) => {
      const base = routineMap.get(log.routineId);
      const routine = base && routineOnDate(base, date);
      return log.date === date && routine?.frequencyType === "weekly_target" && !isRoutineRequiredOnDate(routine, date) && isRoutineActiveOnDate(routine, date);
    });

    const routineStatuses = [
      ...requiredRoutines.map((routine) => logMap.get(`${routine.id}:${date}`)?.status ?? "pending"),
      ...flexibleLogs.map((log) => log.status),
    ].filter((status) => status !== "exempted");
    const taskCompleted = tasks.filter((task) => task.status === "completed").length;
    const routineCompleted = routineStatuses.filter((status) => status === "completed").length;
    const hasScheduledRoutine = requiredRoutines.length > 0 || flexibleLogs.length > 0;
    const qualifiesForPlanning = tasks.length > 0 && hasScheduledRoutine;
    const qualifiesForCompletion = qualifiesForPlanning
      && taskCompleted === tasks.length
      && routineCompleted === routineStatuses.length;

    return {
      date,
      hasData: allTasks.length > 0 || requiredRoutines.length > 0 || flexibleLogs.length > 0,
      qualifiesForPlanning,
      qualifiesForCompletion,
      taskTotal: tasks.length,
      taskCompleted,
      routineTotal: routineStatuses.length,
      routineCompleted,
    };
  });

  return {
    planningCurrent: currentStreak(days, "qualifiesForPlanning"),
    planningLongest: longestStreak(days, "qualifiesForPlanning"),
    completionCurrent: currentStreak(days, "qualifiesForCompletion"),
    completionLongest: longestStreak(days, "qualifiesForCompletion"),
    days,
  };
}
