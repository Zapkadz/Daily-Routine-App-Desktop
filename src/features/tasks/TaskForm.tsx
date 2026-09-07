import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { usePreferencesStore } from '../../stores/preferencesStore';
import type { Category, CreateTaskInput, Task, TaskPriority, TaskRecurrence } from "../../types/task";
import { isPastLocalDate, localDateKey } from '../../utils/date';
import { useLocalToday } from '../../hooks/useLocalToday';

type TaskFormProps = {
  defaultDate: string;
  task?: Task;
  categories: Category[];
  onCancel: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function TaskForm({ defaultDate, task, categories, onCancel, onSubmit, onDelete }: TaskFormProps) {
  const priorityLabels = usePreferencesStore(state => state.value.priorityLabels);
  const minimumDate = useLocalToday();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [scheduledDate, setScheduledDate] = useState(task?.scheduledDate ?? defaultDate);
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "none");
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? "");
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrence | "">(
    (task?.recurrenceRule as TaskRecurrence | null) ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateIsPast = isPastLocalDate(scheduledDate, minimumDate) && scheduledDate !== task?.scheduledDate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!title.trim()) {
      setError("Task title is required.");
      event.currentTarget.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    if (!scheduledDate) {
      setError("Choose a date for this task.");
      event.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
      return;
    }
    if (isPastLocalDate(scheduledDate, localDateKey()) && scheduledDate !== task?.scheduledDate) {
      setError("Choose today or a future date.");
      event.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description,
        scheduledDate,
        dueTime,
        priority,
        categoryId: categoryId || undefined,
        recurrenceRule: recurrenceRule || undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create this task.");
      setIsSaving(false);
    }
  }

  return (
    <form className="task-form" noValidate aria-busy={isSaving} onSubmit={handleSubmit}>
      <label className="field field-full">
        <span>Task title</span>
        <input autoFocus aria-invalid={!!error && !title.trim()} aria-describedby={error ? "task-form-error" : undefined} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" />
      </label>
      <label className="field field-full">
        <span>Notes</span>
        <textarea className="resize-none" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add useful context..." rows={3} />
      </label>
      <label className="field">
        <span>Date</span>
        <input type="date" required min={minimumDate} value={scheduledDate} aria-invalid={!!error && dateIsPast} aria-describedby={error ? "task-form-error" : undefined} onChange={(event) => setScheduledDate(event.target.value)} />
        <small className="field-hint">New tasks can be planned from today onward.</small>
      </label>
      <label className="field">
        <span>Time</span>
        <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
      </label>
      <label className="field field-full">
        <span>Priority</span>
        <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
          {(['none','low','medium','high'] as const).map(key => <option key={key} value={key}>{priorityLabels[key]}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Category</span>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">No category</option>
          {categories.filter(category => category.is_active !== 0 || category.id === categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_active === 0 ? ' (hidden)' : ''}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Repeat</span>
        <select value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value as TaskRecurrence | "")}>
          <option value="">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      {error && <p id="task-form-error" className="form-error" role="alert">{error}</p>}
      <div className="form-actions field-full">
        {onDelete && <Button type="button" className="danger-button" variant="ghost" onClick={() => void onDelete()}>Delete permanently</Button>}
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : task ? "Save changes" : "Create task"}</Button>
      </div>
    </form>
  );
}
