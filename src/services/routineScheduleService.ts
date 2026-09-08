import { getISODay, parseISO } from "date-fns";
import type { Routine, RoutineSnapshot } from "../types/routine";
import { localDateKey } from "../utils/date";

type WeekdaysRule = { weekdays?: number[] };
type WeeklyTargetRule = { target?: number };

function parseRule<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

export function isRoutineRequiredOnDate(routine: Routine, dateKey: string) {
  routine = routineOnDate(routine, dateKey);
  if (!isRoutineActiveOnDate(routine, dateKey)) return false;
  if (routine.explicitlyScheduled) return true;
  if (routine.frequencyType === "daily") return true;
  if (routine.frequencyType === 'custom_dates') return (parseRule<{dates?: string[]}>(routine.frequencyRule).dates ?? []).includes(dateKey);
  if (routine.frequencyType === "weekly_target") return false;

  const rule = parseRule<WeekdaysRule>(routine.frequencyRule);
  return (rule.weekdays ?? []).includes(getISODay(parseISO(dateKey)));
}

export function isRoutineAvailableOnDate(routine: Routine, dateKey: string) {
  routine = routineOnDate(routine, dateKey);
  if (!isRoutineActiveOnDate(routine, dateKey)) return false;
  return routine.frequencyType === "weekly_target" || isRoutineRequiredOnDate(routine, dateKey);
}

export function isRoutineActiveOnDate(routine: Routine, dateKey: string) {
  routine = routineOnDate(routine, dateKey);
  if (routine.occurrences?.find(item => item.date === dateKey)?.removed) return false;
  if (dateKey < routine.startDate) return false;
  if (!routine.archivedAt) return true;
  return dateKey <= localDateKey(new Date(routine.archivedAt));
}

export function routineFrequencyLabel(routine: Routine) {
  if (routine.frequencyType === 'custom_dates') return 'Custom dates';
  if (routine.frequencyType === "daily") return "Every day";
  if (routine.frequencyType === "weekly_target") {
    const rule = parseRule<WeeklyTargetRule>(routine.frequencyRule);
    return `${rule.target ?? 1} times per week`;
  }

  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rule = parseRule<WeekdaysRule>(routine.frequencyRule);
  return (rule.weekdays ?? []).map((day) => weekdayNames[day - 1]).join(", ") || "Selected days";
}

export function serializeRoutineRule(input: Pick<import("../types/routine").CreateRoutineInput, "frequencyType" | "weekdays" | "weeklyTarget" | 'customDates'>) {
  if (input.frequencyType === 'custom_dates') return JSON.stringify({dates: [...new Set(input.customDates ?? [])].sort()});
  if (input.frequencyType === "weekdays") return JSON.stringify({ weekdays: [...input.weekdays].sort() });
  if (input.frequencyType === "weekly_target") return JSON.stringify({ target: input.weeklyTarget });
  return "{}";
}

export function routineSnapshot(routine: Routine): RoutineSnapshot {
  const { name, description, icon, color, frequencyType, frequencyRule, reminderTime, reminderEnabled, startDate } = routine;
  return { name, description, icon, color, frequencyType, frequencyRule, reminderTime, reminderEnabled, startDate };
}

// Resolve the historical definition first, then an explicit single-day choice.
// Both are persisted, so old schedules survive edits even on days the app was closed.
export function routineOnDate(routine: Routine, date: string): Routine {
  if (routine.occurrenceDate === date) return routine;
  let snapshot: RoutineSnapshot | undefined;
  for (const revision of routine.revisions ?? []) {
    if (revision.date <= date) snapshot = revision.snapshot;
  }
  const occurrence = routine.occurrences?.find(item => item.date === date);
  return { ...routine, ...snapshot, ...(occurrence?.snapshot ?? {}), occurrenceDate: date, explicitlyScheduled: !!occurrence && !occurrence.removed };
}

export function routinesOnDate(routines: Routine[], date: string) {
  return routines.map(routine => routineOnDate(routine, date))
    .filter(routine => isRoutineAvailableOnDate(routine, date))
    .sort((a, b) => (a.reminderTime ?? '99:99').localeCompare(b.reminderTime ?? '99:99'));
}
