import { addDays, format, parseISO, subDays } from "date-fns";
import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { RoutineSchedule } from "../features/routines/RoutineSchedule";
import { RoutineModal } from "../features/routines/RoutineModal";
import { isRoutineAvailableOnDate, isRoutineRequiredOnDate } from "../services/routineScheduleService";
import { useRoutineStore } from "../stores/routineStore";
import type { Routine, RoutineStatus } from "../types/routine";
import { localDateKey } from "../utils/date";

export function RoutinesPage() {
  const todayKey = localDateKey();
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
  const routines = useRoutineStore((state) => state.routines);
  const logsForToday = useRoutineStore((state) => state.logsByDate[todayKey]);
  const logs = logsForToday ?? [];
  const isInitialized = useRoutineStore((state) => state.isInitialized);
  const isLoading = useRoutineStore((state) => state.isLoading);
  const error = useRoutineStore((state) => state.error);
  const historyLogs = useRoutineStore((state) => state.historyLogs);
  const loadRoutines = useRoutineStore((state) => state.loadRoutines);
  const loadLogs = useRoutineStore((state) => state.loadLogs);
  const loadHistory = useRoutineStore((state) => state.loadHistory);
  const setStatus = useRoutineStore((state) => state.setStatus);
  const archiveRoutine = useRoutineStore((state) => state.archiveRoutine);
  const availableRoutines = useMemo(() => routines.filter((routine) => isRoutineAvailableOnDate(routine, todayKey)), [routines, todayKey]);
  const historyDates = useMemo(() => {
    const start = subDays(parseISO(todayKey), 6);
    return Array.from({ length: 7 }, (_, index) => localDateKey(addDays(start, index)));
  }, [todayKey]);

  useEffect(() => {
    if (!isInitialized) void loadRoutines();
    void loadLogs(todayKey);
    void loadHistory(historyDates[0], historyDates[historyDates.length - 1]);
  }, [historyDates, isInitialized, loadHistory, loadLogs, loadRoutines, todayKey]);

  function statusFor(routine: Routine): RoutineStatus {
    return logs.find((log) => log.routineId === routine.id)?.status ?? "pending";
  }

  return (
    <section className="page routines-page">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Build your rhythm</p>
          <h1>Daily Routine</h1>
          <p className="header-copy">Your daily schedule: from getting up to winding down.</p>
        </div>
        <Button icon={<Plus size={17} />} onClick={() => { setEditingRoutine(undefined); setShowModal(true); }}>New routine</Button>
      </header>

      <div className="routine-summary">
        <div><span>Active routines</span><strong>{routines.length}</strong></div>
        <div><span>Scheduled today</span><strong>{availableRoutines.length}</strong></div>
        <div><span>Completed today</span><strong>{availableRoutines.filter((routine) => statusFor(routine) === "completed").length}</strong></div>
      </div>

      {error && <p className="data-error" role="alert">{error}</p>}
      <section className="routine-list-section">
        <div className="section-heading">
          <div><p className="eyebrow">Today</p><h2>Schedule</h2></div>
        </div>
        {isLoading && <div className="empty-list">Loading your routines...</div>}
        {!isLoading && routines.length === 0 && (
          <div className="empty-list"><span>No routines yet. Start with one action you can repeat.</span><button type="button" onClick={() => setShowModal(true)}>Create your first routine</button></div>
        )}
        <RoutineSchedule routines={availableRoutines} statusFor={statusFor}
          onStatusChange={(routine, status) => void setStatus(routine, todayKey, status)}
          onEdit={(routine) => { setEditingRoutine(routine); setShowModal(true); }}
          onArchive={(routine) => void archiveRoutine(routine)} />
        <button className="inline-add" onClick={() => { setEditingRoutine(undefined); setShowModal(true); }}><Plus size={15} /> New event</button>
        {routines.some((routine) => !availableRoutines.includes(routine)) && <details style={{ marginTop: 20 }}><summary>Other scheduled activities</summary>
          {routines.filter((routine) => !availableRoutines.includes(routine)).map((routine) => <button key={routine.id} className="inline-add" onClick={() => { setEditingRoutine(routine); setShowModal(true); }}>{routine.name} · Edit schedule</button>)}
        </details>}
      </section>

      {routines.length > 0 && (
        <section className="routine-history-section">
          <div className="section-heading">
            <div><p className="eyebrow">Recent activity</p><h2>Last 7 days</h2></div>
          </div>
          <div className="history-grid" style={{ gridTemplateColumns: `minmax(150px, 1fr) repeat(${historyDates.length}, 44px)` }}>
            <span className="history-corner">Routine</span>
            {historyDates.map((date) => <span className="history-date" key={date}>{format(parseISO(date), "EEE")}<small>{format(parseISO(date), "d")}</small></span>)}
            {routines.flatMap((routine) => [
              <strong className="history-name" key={`${routine.id}-name`}>{routine.name}</strong>,
              ...historyDates.map((date) => {
                const log = historyLogs.find((item) => item.routineId === routine.id && item.date === date);
                const required = isRoutineRequiredOnDate(routine, date);
                const symbol = log?.status === "completed" ? <Check size={13} /> : log?.status === "skipped" ? <Minus size={13} /> : log?.status === "exempted" ? "E" : "";
                return <span className={`history-cell status-${log?.status ?? (required ? "pending" : "off")}`} key={`${routine.id}-${date}`} title={`${routine.name}: ${log?.status ?? (required ? "pending" : "not scheduled")}`}>{symbol}</span>;
              }),
            ])}
          </div>
        </section>
      )}

      {showModal && <RoutineModal defaultDate={todayKey} routine={editingRoutine} onClose={() => setShowModal(false)} />}
    </section>
  );
}
