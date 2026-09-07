export type TaskStatus = "todo" | "completed" | "cancelled" | "archived";
export type TaskPriority = "none" | "low" | "medium" | "high";
export type TaskRecurrence = "daily" | "weekly" | "monthly";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId: string | null;
  categoryName: string | null;
  scheduledDate: string;
  dueTime: string | null;
  recurrenceRule: TaskRecurrence | null;
  recurrenceSourceId: string | null;
  createdAt: string;
  completedAt: string | null;
  archivedAt: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  scheduledDate: string;
  dueTime?: string;
  categoryId?: string;
  recurrenceRule?: TaskRecurrence;
};

export type Category = {
  is_active?: number;
  id: string;
  name: string;
  color: string;
  icon: string | null;
};
