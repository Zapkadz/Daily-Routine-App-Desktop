import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { RoutineIcon } from '../../components/RoutineIcon';
import { usePreferencesStore } from '../../stores/preferencesStore';
import type { CreateRoutineInput, Routine, RoutineFrequencyType } from "../../types/routine";
import { isPastLocalDate, localDateKey } from '../../utils/date';
import { useLocalToday } from '../../hooks/useLocalToday';

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
  const iconOptions = usePreferencesStore(state => state.value.icons);
  const minimumDate = useLocalToday();
  const rule = initialRule(routine);
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [icon, setIcon] = useState(routine?.icon ?? iconOptions.find(item => item.enabled)?.id ?? "sparkles");
  const [color, setColor] = useState(routine?.color ?? "#4f8a68");
  const [frequencyType, setFrequencyType] = useState<RoutineFrequencyType>(routine?.frequencyType ?? "daily");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(rule.weekdays ?? [1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(rule.target ?? 3);
  const [reminderTime, setReminderTime] = useState(routine?.reminderTime ?? "");
  const [startDate, setStartDate] = useState(routine?.startDate ?? defaultDate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateIsPast = isPastLocalDate(startDate, minimumDate) && startDate !== routine?.startDate;

  function toggleWeekday(day: number) {
    setSelectedWeekdays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      setError("Routine name is required.");
      event.currentTarget.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    if (!startDate) {
      setError("Choose a start date.");
      event.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
      return;
    }
    if (isPastLocalDate(startDate, localDateKey()) && startDate !== routine?.startDate) {
      setError("Choose today or a future start date.");
      event.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
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
    <form className="task-form" noValidate aria-busy={isSaving} onSubmit={handleSubmit}>
      <label className="field field-full">
        <span>Event</span>
        <input autoFocus aria-invalid={!!error && !name.trim()} aria-describedby={error ? "routine-form-error" : undefined} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Get up, Study Japanese, Lunch" />
      </label>
      <label className="field field-full">
        <span>Notes</span>
        <textarea className="resize-none" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why does this routine matter?" rows={3} />
      </label>
      <label className="field">
        <span>Icon</span>
        <select value={icon} onChange={(event) => setIcon(event.target.value)}>
          {iconOptions.filter(item => item.enabled || item.id === icon).map(item => <option key={item.id} value={item.id}>{item.label}{!item.enabled ? ' (hidden)' : ''}</option>)}
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
      <div className="routine-preview field-full"><RoutineIcon icon={icon} color={color} /><span>{name.trim() || 'Your routine'}<small>Icon and color preview</small></span></div>
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
        <input type="date" required min={minimumDate} value={startDate} aria-invalid={!!error && dateIsPast} aria-describedby={error ? "routine-form-error" : undefined} onChange={(event) => setStartDate(event.target.value)} />
        <small className="field-hint">New routines can start from today onward.</small>
      </label>
      <label className="field">
        <span>Time</span>
        <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
      </label>
      {error && <p id="routine-form-error" className="form-error" role="alert">{error}</p>}
      <div className="form-actions field-full">
        {onDelete && <Button type="button" className="danger-button" variant="ghost" onClick={() => void onDelete()}>Delete permanently</Button>}
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : routine ? "Save changes" : "Create routine"}</Button>
      </div>
    </form>
  );
}
