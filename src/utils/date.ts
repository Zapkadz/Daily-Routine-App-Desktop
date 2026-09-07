import { format } from "date-fns";

export function localDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}
