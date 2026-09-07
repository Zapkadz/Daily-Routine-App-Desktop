import { isAfter, isBefore, parseISO } from "date-fns";
import type { Task } from "../../types/task";

export type TaskFilter = "all" | "today" | "upcoming" | "overdue" | "completed";

export function filterTasks(tasks: Task[], filter: TaskFilter, todayKey: string) {
  const today = parseISO(todayKey);
  return tasks.filter((task) => {
    if (filter === "today") return task.scheduledDate === todayKey;
    if (filter === "completed") return task.status === "completed";
    if (filter === "upcoming") return task.status !== "completed" && isAfter(parseISO(task.scheduledDate), today);
    if (filter === "overdue") return task.status !== "completed" && isBefore(parseISO(task.scheduledDate), today);
    return true;
  });
}
