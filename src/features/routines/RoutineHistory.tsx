import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '../../components/Button';
import { RoutineIcon } from '../../components/RoutineIcon';
import { isRoutineActiveOnDate, isRoutineRequiredOnDate, routineOnDate } from '../../services/routineScheduleService';
import type { Routine, RoutineLog } from '../../types/routine';

export function RoutineHistory({ routines, logs, dates, loading, error, onRetry }: {
  routines: Routine[]; logs: RoutineLog[]; dates: string[]; loading: boolean; error: string | null; onRetry: () => void;
}) {
  const [view, setView] = useState<'day' | 'routine'>('day');
  const [selected, setSelected] = useState(dates[dates.length - 1]);
  const date = dates.includes(selected) ? selected : dates[dates.length - 1];
  const logMap = useMemo(() => new Map(logs.map(log => [`${log.routineId}:${log.date}`, log])), [logs]);
  function entry(source: Routine, day: string) {
    const routine = routineOnDate(source, day);
    const log = logMap.get(`${routine.id}:${day}`);
    const scheduled = isRoutineActiveOnDate(routine, day) && (isRoutineRequiredOnDate(routine, day) || !!log);
    return { routine, status: scheduled ? log?.status ?? 'pending' : 'off' };
  }
  const rows = routines.map(source => entry(source, date)).filter(row => row.status !== 'off')
    .sort((a, b) => (a.routine.reminderTime ?? '99:99').localeCompare(b.routine.reminderTime ?? '99:99'));
  const matrixRows = routines.filter(source => dates.some(day => entry(source, day).status !== 'off'));
  return <section className="routine-history-section">
    <div className="section-heading"><h2>Last 7 days</h2><div className="history-view-switch" aria-label="History view">
      <Button variant={view === 'day' ? 'primary' : 'secondary'} aria-pressed={view === 'day'} onClick={() => setView('day')}>By day</Button>
      <Button variant={view === 'routine' ? 'primary' : 'secondary'} aria-pressed={view === 'routine'} onClick={() => setView('routine')}>By routine</Button>
    </div></div>
    {loading ? <div className="empty-list" role="status">Loading schedule history...</div> : error ? <div className="data-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={onRetry}>Retry history</Button></div> : view === 'day' ? <>
      <div className="history-day-picker" aria-label="Choose a history date">{dates.map(day => <button type="button" key={day} aria-label={format(parseISO(day), 'EEEE, MMMM d, yyyy')} aria-pressed={day === date} onClick={() => setSelected(day)}><span>{format(parseISO(day), 'EEE')}</span><strong>{format(parseISO(day), 'd')}</strong></button>)}</div>
      <p className="planning-note" role="status">{format(parseISO(date), 'EEEE, MMMM d')} · {rows.filter(row => row.status === 'completed').length}/{rows.filter(row => row.status !== 'exempted').length} completed{rows.some(row => row.status === 'exempted') ? ' · Exempted activities excluded' : ''}</p>
      {rows.length ? <div className="schedule-scroll history-table-scroll"><table className="schedule-table"><thead><tr><th>Time</th><th>Event</th><th>Status</th></tr></thead><tbody>{rows.map(({ routine, status }) => <tr key={routine.id}><td>{routine.reminderTime ?? 'Any time'}</td><td><span className="history-event"><RoutineIcon icon={routine.icon} color={routine.color} /><span>{routine.name}</span></span></td><td className="history-status">{status}</td></tr>)}</tbody></table></div> : <div className="empty-list compact">No activities scheduled for this date.</div>}
    </> : <>
      <p className="planning-note">✓ Completed · − Skipped · E Exempted · ○ Pending · — Not scheduled. By day shows each day's original name and time.</p>
      <div className="history-matrix-scroll"><div className="history-grid" style={{ gridTemplateColumns: 'minmax(150px, 1fr) repeat(7, 44px)' }}>
        <span className="history-corner">Routine</span>{dates.map(day => <span className="history-date" key={day}>{format(parseISO(day), 'EEE')}<small>{format(parseISO(day), 'd')}</small></span>)}
        {matrixRows.flatMap(source => [<strong className="history-name" key={source.id}>{routineOnDate(source, dates[dates.length - 1]).name}{source.archivedAt ? ' (archived)' : ''}</strong>, ...dates.map(day => {
          const { routine, status } = entry(source, day);
          const label = `${day}: ${routine.name}, ${routine.reminderTime ?? 'Any time'}, ${status === 'off' ? 'not scheduled' : status}`;
          return <span className={`history-cell status-${status}`} key={`${source.id}:${day}`} title={label} aria-label={label}>{status === 'completed' ? '✓' : status === 'skipped' ? '−' : status === 'exempted' ? 'E' : status === 'pending' ? '○' : '—'}</span>;
        })])}
      </div></div>{!matrixRows.length && <div className="empty-list compact">No activities in these seven days.</div>}
    </>}
  </section>;
}
