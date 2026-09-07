export type RoutineFrequencyType = "daily" | "weekdays" | "weekly_target";
export type RoutineStatus = "pending" | "completed" | "skipped" | "exempted";

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  frequencyType: RoutineFrequencyType;
  frequencyRule: string;
  reminderTime: string | null;
  isActive: boolean;
  startDate: string;
  createdAt: string;
  archivedAt: string | null;
};

export type RoutineLog = {
  id: string;
  routineId: string;
  date: string;
  status: RoutineStatus;
  completedAt: string | null;
  note: string | null;
};

export type CreateRoutineInput = {
  name: string;
  description?: string;
  icon?: string;
  color: string;
  frequencyType: RoutineFrequencyType;
  weekdays: number[];
  weeklyTarget: number;
  reminderTime?: string;
  startDate: string;
};
