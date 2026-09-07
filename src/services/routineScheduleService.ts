import { getISODay, parseISO } from "date-fns";
import type { Routine } from "../types/routine";
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
  if (!isRoutineActiveOnDate(routine, dateKey)) return false;
  if (routine.frequencyType === "daily") return true;
  if (routine.frequencyType === "weekly_target") return false;

  const rule = parseRule<WeekdaysRule>(routine.frequencyRule);
  return (rule.weekdays ?? []).includes(getISODay(parseISO(dateKey)));
}

export function isRoutineAvailableOnDate(routine: Routine, dateKey: string) {
  if (!isRoutineActiveOnDate(routine, dateKey)) return false;
  return routine.frequencyType === "weekly_target" || isRoutineRequiredOnDate(routine, dateKey);
}

export function isRoutineActiveOnDate(routine: Routine, dateKey: string) {
  if (dateKey < routine.startDate) return false;
  if (!routine.archivedAt) return true;
  return dateKey <= localDateKey(new Date(routine.archivedAt));
}

export function routineFrequencyLabel(routine: Routine) {
  if (routine.frequencyType === "daily") return "Every day";
  if (routine.frequencyType === "weekly_target") {
    const rule = parseRule<WeeklyTargetRule>(routine.frequencyRule);
    return `${rule.target ?? 1} times per week`;
  }

  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rule = parseRule<WeekdaysRule>(routine.frequencyRule);
  return (rule.weekdays ?? []).map((day) => weekdayNames[day - 1]).join(", ") || "Selected days";
}

export function serializeRoutineRule(input: Pick<import("../types/routine").CreateRoutineInput, "frequencyType" | "weekdays" | "weeklyTarget">) {
  if (input.frequencyType === "weekdays") return JSON.stringify({ weekdays: [...input.weekdays].sort() });
  if (input.frequencyType === "weekly_target") return JSON.stringify({ target: input.weeklyTarget });
  return "{}";
}
