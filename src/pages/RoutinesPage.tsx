import { addDays, parseISO, subDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { RoutineSchedule } from '../features/routines/RoutineSchedule';
import { RoutineModal } from '../features/routines/RoutineModal';
import { RoutineLibrary } from '../features/routines/RoutineLibrary';
import { RoutineHistory } from '../features/routines/RoutineHistory';
import { routinesOnDate, isRoutineRequiredOnDate } from '../services/routineScheduleService';
import { useRoutineStore } from '../stores/routineStore';
import { useLocalToday } from '../hooks/useLocalToday';
import type { Routine, RoutineStatus } from '../types/routine';
import { localDateKey } from '../utils/date';

export function RoutinesPage() {
  const todayKey = useLocalToday();
  const [editor, setEditor] = useState<{ date: string; routine?: Routine }>();
  const [archiving, setArchiving] = useState<Routine>();
  const [busy, setBusy] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const state = useRoutineStore();
  const { isInitialized, loadRoutines, loadLogs, loadHistory } = state;
  const available = useMemo(() => routinesOnDate(state.routines, todayKey), [state.routines, todayKey]);
  const historyDates = useMemo(() => {
    const start = subDays(parseISO(todayKey), 6);
    return Array.from({ length: 7 }, (_, index) => localDateKey(addDays(start, index)));
  }, [todayKey]);
  useEffect(() => {
    if (!isInitialized) void loadRoutines();
    void loadLogs(todayKey);
    void loadHistory(historyDates[0], historyDates[6]);
  }, [historyDates, isInitialized, loadHistory, loadLogs, loadRoutines, todayKey]);
  function statusFor(routine: Routine): RoutineStatus {
    return state.logsByDate[todayKey]?.find(log => log.routineId === routine.id)?.status ?? 'pending';
  }
  const edit = (routine: Routine) => setEditor({ date: todayKey, routine });
  return <section className="page routines-page">
    <header className="page-header compact-header"><div><p className="eyebrow">Build your rhythm</p><h1>Daily Routine</h1><p className="header-copy">A steady rhythm, with room for each day's plans.</p></div><Button icon={<Plus size={17} />} onClick={() => setEditor({ date: todayKey })}>New routine</Button></header>
    <div className="routine-summary">
      <div><span>Active routines</span><strong>{state.isLoading || state.error ? '—' : state.routines.length}</strong></div>
      <div><span>Scheduled today</span><strong>{state.isLoading || state.error ? '—' : available.filter(routine => isRoutineRequiredOnDate(routine, todayKey)).length}</strong></div>
      <div><span>Completed today</span><strong>{state.isLoading || state.error ? '—' : available.filter(routine => statusFor(routine) === 'completed').length}</strong></div>
    </div>
    {state.error && <div className="data-error" role="alert"><p>{state.error}</p><Button variant="secondary" onClick={() => { void loadRoutines(); void loadLogs(todayKey); }}>Retry loading</Button></div>}
    <section className="routine-list-section"><div className="section-heading"><div><p className="eyebrow">Today</p><h2>Schedule</h2></div></div>
      {state.isLoading && <div className="empty-list" role="status">Loading your routines...</div>}
      {!state.isLoading && !state.error && !available.length && <div className="empty-list compact">No activities scheduled for today. Add an event or use an existing activity below.</div>}
      <RoutineSchedule routines={available} statusFor={statusFor} onStatusChange={(routine, status) => void state.setStatus(routine, todayKey, status)} onEdit={edit} onArchive={routine => { setArchiveError(''); setArchiving(routine); }} />
      <button className="inline-add" type="button" onClick={() => setEditor({ date: todayKey })}><Plus size={15} />New event</button>
      <RoutineLibrary routines={state.routines} date={todayKey} onSchedule={edit} />
    </section>
    <RoutineHistory routines={state.allRoutines} logs={state.historyLogs} dates={historyDates} loading={state.isLoading || state.historyLoading} error={state.historyError ?? state.error} onRetry={() => { void loadRoutines(); void loadHistory(historyDates[0], historyDates[6]); }} />
    {editor && <RoutineModal defaultDate={editor.date} routine={editor.routine} onClose={() => setEditor(undefined)} />}
    {archiving && <Modal title="Archive routine" description={`Archive “${archiving.name}”? It will stop appearing in your active schedule. Past schedules and completion history are kept.`} onClose={() => { if (!busy) setArchiving(undefined); }}>
      {archiveError && <p className="form-error" role="alert">{archiveError}</p>}
      <div className="form-actions"><Button autoFocus variant="ghost" disabled={busy} onClick={() => setArchiving(undefined)}>Cancel</Button><Button disabled={busy} onClick={async () => {
        setBusy(true); setArchiveError('');
        try { await state.archiveRoutine(archiving); setArchiving(undefined); } catch (error) { setArchiveError(String(error)); } finally { setBusy(false); }
      }}>{busy ? 'Archiving...' : 'Archive routine'}</Button></div>
    </Modal>}
  </section>;
}
