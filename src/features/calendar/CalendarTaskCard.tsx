import { Clock } from "lucide-react";
import type { DragEvent } from "react";
import type { Task } from "../../types/task";

type CalendarTaskCardProps = { task: Task; onEdit: (task: Task) => void };

export function CalendarTaskCard({ task, onEdit }: CalendarTaskCardProps) {
  return (
    <button
      className={`calendar-task priority-border-${task.priority}`}
      type="button"
      draggable
      onDragStart={(event: DragEvent<HTMLButtonElement>) => {
        event.dataTransfer.setData("text/task-id", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={(event) => { event.stopPropagation(); onEdit(task); }}
    >
      <span className={task.status === "completed" ? "task-title done" : "task-title"}>{task.title}</span>
      <small>{task.dueTime && <><Clock size={10} /> {task.dueTime}</>}{task.categoryName && <em>{task.categoryName}</em>}</small>
    </button>
  );
}
