import { Archive, Clock } from "lucide-react";
import type { Routine, RoutineStatus } from "../../types/routine";

type Props = {
  routines: Routine[];
  statusFor: (routine: Routine) => RoutineStatus;
  onStatusChange: (routine: Routine, status: RoutineStatus) => void;
  onEdit: (routine: Routine) => void;
  onArchive?: (routine: Routine) => void;
};

export function RoutineSchedule({ routines, statusFor, onStatusChange, onEdit, onArchive }: Props) {
  const sorted = [...routines].sort((a, b) => (a.reminderTime ?? "99:99").localeCompare(b.reminderTime ?? "99:99"));
  return <div className="schedule-scroll"><table className="schedule-table">
    <thead><tr><th>Time</th><th>Event</th><th>Status</th>{onArchive && <th><span className="sr-only">Actions</span></th>}</tr></thead>
    <tbody>{sorted.map((routine) => <tr key={routine.id} className={statusFor(routine) === "completed" ? "schedule-completed" : ""}>
      <td><button className="schedule-time" onClick={() => onEdit(routine)}><Clock size={14} />{routine.reminderTime ?? "Any time"}</button></td>
      <td><button className="schedule-event" onClick={() => onEdit(routine)}>{routine.name}</button></td>
      <td><select className="status-select" aria-label={`Status for ${routine.name}`} value={statusFor(routine)} onChange={(event) => onStatusChange(routine, event.target.value as RoutineStatus)}>
        <option value="pending">Pending</option><option value="completed">Completed</option><option value="skipped">Skipped</option><option value="exempted">Exempted</option>
      </select></td>
      {onArchive && <td><button className="more-button" aria-label={`Archive ${routine.name}`} onClick={() => onArchive(routine)}><Archive size={15} /></button></td>}
    </tr>)}</tbody>
  </table></div>;
}
