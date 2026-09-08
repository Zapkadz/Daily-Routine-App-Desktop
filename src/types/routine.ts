export type RoutineFrequencyType = "daily" | "weekdays" | "weekly_target" | "custom_dates";
export type RoutineEditScope = 'date' | 'future';
export type RoutineSnapshot = Pick<Routine, 'name' | 'description' | 'icon' | 'color' | 'frequencyType' | 'frequencyRule' | 'reminderTime' | 'startDate'>;
export type RoutineRevision = { date: string; snapshot: RoutineSnapshot };
export type RoutineOccurrence = { date: string; snapshot: RoutineSnapshot; removed: boolean };
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
  revisions?: RoutineRevision[];
  occurrences?: RoutineOccurrence[];
  occurrenceDate?: string;
  explicitlyScheduled?: boolean;
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
  customDates?: string[];
  editScope?: RoutineEditScope;
  effectiveDate?: string;
};
