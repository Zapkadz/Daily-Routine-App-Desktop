import { Archive, Check, Pencil } from "lucide-react";
import type { CSSProperties } from "react";
import { routineFrequencyLabel } from "../../services/routineScheduleService";
import type { Routine, RoutineStatus } from "../../types/routine";

type RoutineCardProps = {
  routine: Routine;
  status: RoutineStatus;
  onStatusChange: (status: RoutineStatus) => void;
  onEdit?: () => void;
  onArchive?: () => void;
  compact?: boolean;
};

export function RoutineCard({ routine, status, onStatusChange, onEdit, onArchive, compact = false }: RoutineCardProps) {
  const completed = status === "completed";
  return (
    <article className={`live-routine-card${compact ? " compact" : ""}`} style={{ "--routine-color": routine.color } as CSSProperties}>
      <button className={`routine-status-button${completed ? " completed" : ""}`} type="button" onClick={() => onStatusChange(completed ? "pending" : "completed")} aria-label={`Toggle ${routine.name}`}>
        {completed && <Check size={15} />}
      </button>
      <div className="live-routine-copy">
        <strong>{routine.name}</strong>
        <span>{routineFrequencyLabel(routine)}{routine.reminderTime ? ` · ${routine.reminderTime}` : ""}</span>
      </div>
      {!compact && (
        <select className={`status-select status-${status}`} value={status} onChange={(event) => onStatusChange(event.target.value as RoutineStatus)} aria-label={`Status for ${routine.name}`}>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
          <option value="exempted">Exempted</option>
        </select>
      )}
      {(onEdit || onArchive) && (
        <div className="task-actions">
          {onEdit && <button className="more-button" type="button" onClick={onEdit} aria-label={`Edit ${routine.name}`}><Pencil size={15} /></button>}
          {onArchive && <button className="more-button danger" type="button" onClick={onArchive} aria-label={`Archive ${routine.name}`}><Archive size={15} /></button>}
        </div>
      )}
    </article>
  );
}
