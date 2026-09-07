import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import type { CreateRoutineInput, Routine, RoutineFrequencyType } from "../../types/routine";

type RoutineFormProps = {
  defaultDate: string;
  routine?: Routine;
  onCancel: () => void;
  onSubmit: (input: CreateRoutineInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const weekdays = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 7, label: "S" },
];

function initialRule(routine?: Routine) {
  try {
    return JSON.parse(routine?.frequencyRule ?? "{}") as { weekdays?: number[]; target?: number };
  } catch {
    return {};
  }
}

export function RoutineForm({ defaultDate, routine, onCancel, onSubmit, onDelete }: RoutineFormProps) {
  const rule = initialRule(routine);
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [icon, setIcon] = useState(routine?.icon ?? "sparkles");
  const [color, setColor] = useState(routine?.color ?? "#4f8a68");
  const [frequencyType, setFrequencyType] = useState<RoutineFrequencyType>(routine?.frequencyType ?? "daily");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(rule.weekdays ?? [1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(rule.target ?? 3);
  const [reminderTime, setReminderTime] = useState(routine?.reminderTime ?? "");
  const [startDate, setStartDate] = useState(routine?.startDate ?? defaultDate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleWeekday(day: number) {
    setSelectedWeekdays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Routine name is required.");
      return;
    }
    if (frequencyType === "weekdays" && selectedWeekdays.length === 0) {
      setError("Choose at least one weekday.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description,
        icon,
        color,
        frequencyType,
        weekdays: selectedWeekdays,
        weeklyTarget,
        reminderTime,
        startDate,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this routine.");
      setIsSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="field field-full">
        <span>Event</span>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Get up, Study Japanese, Lunch" />
      </label>
      <label className="field field-full">
        <span>Notes</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why does this routine matter?" rows={3} />
      </label>
      <label className="field">
        <span>Icon</span>
        <select value={icon} onChange={(event) => setIcon(event.target.value)}>
          <option value="sparkles">Sparkles</option>
          <option value="book">Book</option>
          <option value="activity">Activity</option>
          <option value="droplets">Water</option>
          <option value="moon">Moon</option>
          <option value="heart">Health</option>
        </select>
      </label>
      <label className="field">
        <span>Color</span>
        <select value={color} onChange={(event) => setColor(event.target.value)}>
          <option value="#4f8a68">Forest</option>
          <option value="#4f7794">Ocean</option>
          <option value="#a9774d">Terracotta</option>
          <option value="#7b6f9e">Lavender</option>
          <option value="#aa6262">Rose</option>
        </select>
      </label>
      <label className="field field-full">
        <span>Schedule</span>
        <select value={frequencyType} onChange={(event) => setFrequencyType(event.target.value as RoutineFrequencyType)}>
          <option value="daily">Every day</option>
          <option value="weekdays">Selected weekdays</option>
          <option value="weekly_target">Times per week</option>
        </select>
      </label>
      {frequencyType === "weekdays" && (
        <div className="field field-full">
          <span>Days</span>
          <div className="weekday-picker">
            {weekdays.map((day) => (
              <button className={selectedWeekdays.includes(day.value) ? "selected" : ""} type="button" key={day.value} onClick={() => toggleWeekday(day.value)}>{day.label}</button>
            ))}
          </div>
        </div>
      )}
      {frequencyType === "weekly_target" && (
        <label className="field field-full">
          <span>Weekly target</span>
          <select value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value} times per week</option>)}
          </select>
        </label>
      )}
      <label className="field">
        <span>Start date</span>
        <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} />
      </label>
      <label className="field">
        <span>Time</span>
        <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions field-full">
        {onDelete && <Button type="button" className="danger-button" variant="ghost" onClick={() => void onDelete()}>Delete permanently</Button>}
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : routine ? "Save changes" : "Create routine"}</Button>
      </div>
    </form>
  );
}
