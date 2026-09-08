import { RoutineIcon } from '../../components/RoutineIcon';
import { routineOnDate, isRoutineAvailableOnDate } from '../../services/routineScheduleService';
import type { Routine } from '../../types/routine';

/** Reuse a definition without creating another routine or a completion log. */
export function RoutineLibrary({ routines, date, onSchedule }: { routines: Routine[]; date: string; onSchedule: (routine: Routine) => void }) {
  const available = routines.filter(routine => !isRoutineAvailableOnDate(routine, date));
  if (!available.length) return null;
  return <details className="routine-library">
    <summary>Use an existing activity ({available.length})</summary>
    <p className="planning-note">Schedule an activity for {date}. Set its time without changing other days.</p>
    <div className="routine-library-list">{available.map(source => {
      const routine = routineOnDate(source, date);
      return <button type="button" className="schedule-event" key={routine.id} onClick={() => onSchedule(source)}>
        <RoutineIcon icon={routine.icon} color={routine.color} /><span>{routine.name}<small>{routine.occurrences?.some(item => item.date === date && item.removed) ? 'Removed from this date · Add back' : 'Schedule for this date'}</small></span>
      </button>;
    })}</div>
  </details>;
}
