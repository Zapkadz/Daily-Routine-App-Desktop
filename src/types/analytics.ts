import type { Routine, RoutineLog } from "./routine";
import type { TaskStatus } from "./task";

export type AnalyticsTask = {
  scheduledDate: string;
  status: TaskStatus;
};

export type StreakData = {
  tasks: AnalyticsTask[];
  routines: Routine[];
  routineLogs: RoutineLog[];
  today: string;
};

export type DailyStreakState = {
  date: string;
  hasData: boolean;
  qualifiesForPlanning: boolean;
  qualifiesForCompletion: boolean;
  taskTotal: number;
  taskCompleted: number;
  routineTotal: number;
  routineCompleted: number;
};

export type StreakSummary = {
  planningCurrent: number;
  planningLongest: number;
  completionCurrent: number;
  completionLongest: number;
  days: DailyStreakState[];
};

export type RoutineAnalytics = {
  id: string;
  name: string;
  color: string;
  completed: number;
  expected: number;
  rate: number;
};

export type AnalyticsSummary = {
  year: number;
  activeRoutines: number;
  trackedDays: number;
  plannedDays: number;
  completedDays: number;
  planningRate: number;
  completionRate: number;
  last7CompletionRate: number;
  last30CompletionRate: number;
  tasksCompleted: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  streaks: StreakSummary;
  yearDays: DailyStreakState[];
  routineStats: RoutineAnalytics[];
};
