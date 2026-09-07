import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";
import type { TaskRecurrence } from "../types/task";

export function nextOccurrenceDate(scheduledDate: string, recurrence: TaskRecurrence) {
  const date = parseISO(scheduledDate);
  const nextDate = recurrence === "daily"
    ? addDays(date, 1)
    : recurrence === "weekly"
      ? addWeeks(date, 1)
      : addMonths(date, 1);

  return format(nextDate, "yyyy-MM-dd");
}
