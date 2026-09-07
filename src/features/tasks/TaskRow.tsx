import { Archive, Check, Circle, Pencil } from "lucide-react";
import type { Task } from "../../types/task";

type TaskRowProps = {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
  showDate?: boolean;
};

function formatTaskMeta(task: Task, showDate: boolean) {
  const values = [];
  if (showDate) values.push(task.scheduledDate);
  if (task.dueTime) values.push(task.dueTime);
  if (task.categoryName) values.push(task.categoryName);
  if (task.recurrenceRule) values.push(`Repeats ${task.recurrenceRule}`);
  return values.length > 0 ? values.join(" · ") : "Any time";
}

export function TaskRow({ task, onToggle, onEdit, onArchive, showDate = false }: TaskRowProps) {
  const isCompleted = task.status === "completed";
  return (
    <div className={`task-item${isCompleted ? " completed" : ""}`}>
      <button className="check-button" type="button" aria-label={`Toggle ${task.title}`} onClick={() => onToggle(task)}>
        {isCompleted ? <Check size={15} /> : <Circle size={17} />}
      </button>
      <div className="item-copy">
        <strong>{task.title}</strong>
        <span>{formatTaskMeta(task, showDate)}</span>
      </div>
      {task.priority !== "none" && <span className={`priority priority-${task.priority}`}>{task.priority}</span>}
      <div className="task-actions">
        <button className="more-button" type="button" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}><Pencil size={15} /></button>
        <button className="more-button danger" type="button" aria-label={`Archive ${task.title}`} onClick={() => onArchive(task)}><Archive size={15} /></button>
      </div>
    </div>
  );
}
