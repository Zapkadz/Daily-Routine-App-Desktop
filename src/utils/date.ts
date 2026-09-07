import { addDays, format, parseISO } from "date-fns";

export function localDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function isPastLocalDate(date: string, today = localDateKey()) {
  return date < today;
}

export function tomorrowDateKey(today = localDateKey()) {
  return localDateKey(addDays(parseISO(today), 1));
}
