import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { TaskRow } from '../features/tasks/TaskRow';
import { TaskModal } from '../features/tasks/TaskModal';
import { RoutineSchedule } from '../features/routines/RoutineSchedule';
import { RoutineModal } from '../features/routines/RoutineModal';
import { RoutineLibrary } from '../features/routines/RoutineLibrary';
import { useTaskStore } from '../stores/taskStore';
import { useRoutineStore } from '../stores/routineStore';
import { useLocalToday } from '../hooks/useLocalToday';
import { tomorrowDateKey } from '../utils/date';
import { isRoutineAvailableOnDate, isRoutineRequiredOnDate, routinesOnDate } from '../services/routineScheduleService';
import type { Task } from '../types/task';
import type { Routine } from '../types/routine';

export function PlanTomorrowPage() {
  const today = useLocalToday();
  const date = tomorrowDateKey(today);
  const taskState = useTaskStore();
  const routineState = useRoutineStore();
  const [taskEditor, setTaskEditor] = useState<{ date: string; task?: Task }>();
  const [routineEditor, setRoutineEditor] = useState<{ date: string; routine?: Routine }>();
  const [notice, setNotice] = useState('');
  const { isInitialized: tasksReady, loadTasks } = taskState;
  const { isInitialized: routinesReady, loadRoutines } = routineState;
  useEffect(() => {
    if (!tasksReady) void loadTasks();
    if (!routinesReady) void loadRoutines();
  }, [tasksReady, routinesReady, loadTasks, loadRoutines]);
  useEffect(() => { document.title = 'Plan tomorrow · Daily Routine'; return () => { document.title = 'Daily Routine'; }; }, []);
  const tasks = taskState.tasks.filter(task => task.scheduledDate === date && task.status !== 'cancelled');
  const routines = routinesOnDate(routineState.routines, date);
  const scheduled = routines.filter(routine => isRoutineRequiredOnDate(routine, date));
  const flexible = routines.length - scheduled.length;
  const times = [...tasks.map(task => task.dueTime), ...scheduled.map(routine => routine.reminderTime)].filter((time): time is string => !!time).sort();
  const unavailable = !tasksReady || !routinesReady || taskState.isLoading || routineState.isLoading || !!taskState.error || !!routineState.error;
  // Keep open form defaults pinned to their explicit date when midnight passes.
  const addTask = () => { setNotice(''); setTaskEditor({ date }); };
  const addRoutine = () => { setNotice(''); setRoutineEditor({ date }); };
  return <section className="page tomorrow-page">
    <div className="day-plan-navigation"><Link className="button button-ghost" to="/today"><ArrowLeft size={16} />Back to Today</Link><span className="header-date">Tomorrow · {format(parseISO(date), 'EEE, MMM d, yyyy')}</span></div>
    <header className="page-header"><div><p className="eyebrow">Plan ahead</p><h1>Plan for tomorrow</h1><p className="header-copy">Set up a clear start before the day begins.</p></div></header>
    <div className="routine-summary" aria-label="Tomorrow's plan summary">
      <div><span>Tasks planned</span><strong>{unavailable ? '—' : tasks.length}</strong></div>
      <div><span>Routines scheduled</span><strong>{unavailable ? '—' : scheduled.length}</strong>{flexible > 0 && <small>{flexible} flexible routines available</small>}</div>
      <div><span>First activity</span><strong>{unavailable ? '—' : times[0] ?? 'No time set'}</strong></div>
    </div>
    <p className="planning-note">Plan now; mark items complete when the day arrives. Streaks are calculated through today.</p>
    <div className="dashboard-grid">
      <article className="content-card"><div className="section-heading"><h2>Tomorrow's tasks</h2><Button variant="secondary" icon={<Plus size={17} />} onClick={addTask}>Add task</Button></div>
        <div className="item-list">
          {taskState.error && <div className="data-error" role="alert"><p>Unable to load or update tasks. Your saved data has not been cleared.</p><p>{taskState.error}</p><Button variant="secondary" onClick={() => void loadTasks()}>Retry loading</Button></div>}
          {(!tasksReady || taskState.isLoading) && <div className="empty-list compact" role="status">Loading your tasks...</div>}
          {tasksReady && !taskState.isLoading && !taskState.error && tasks.length === 0 && <div className="empty-list compact"><span>No tasks planned for tomorrow yet.</span><button type="button" onClick={addTask}>Add tomorrow's first task</button></div>}
          {tasks.map(task => <TaskRow key={task.id} mode="planning" task={task} onEdit={task => setTaskEditor({ date: task.scheduledDate, task })} onArchive={taskState.archiveTask} />)}
        </div><button className="inline-add" type="button" onClick={addTask}><Plus size={16} />Add another task</button>
      </article>
      <article className="content-card"><div className="section-heading"><h2>Tomorrow's schedule</h2><Button variant="secondary" icon={<Plus size={17} />} onClick={addRoutine}>Add routine</Button></div>
        {routineState.error && <div className="data-error" role="alert"><p>Unable to load routines.</p><p>{routineState.error}</p><Button variant="secondary" onClick={() => void loadRoutines()}>Retry loading</Button></div>}
        {(!routinesReady || routineState.isLoading) && <div className="empty-list compact" role="status">Loading your routines...</div>}
        {routinesReady && !routineState.isLoading && !routineState.error && routines.length === 0 && <div className="empty-list compact"><span>No routines scheduled for tomorrow yet.</span><button type="button" onClick={addRoutine}>Create a routine</button></div>}
        {routines.length > 0 && <RoutineSchedule routines={routines} mode="planning" onEdit={routine => setRoutineEditor({ date, routine })} />}
        <RoutineLibrary routines={routineState.routines} date={date} onSchedule={routine => setRoutineEditor({ date, routine })} />
        <p className="planning-note">Keep a repeating rhythm or choose Custom dates. Edits apply to this date only unless you choose otherwise.</p>
      </article>
    </div>
    <p className="planning-feedback" role="status">{notice}</p>
    {taskEditor && <TaskModal defaultDate={taskEditor.date} task={taskEditor.task} onClose={() => setTaskEditor(undefined)} onSaved={task => setNotice(`Task saved for ${task.scheduledDate}${task.scheduledDate !== date ? '. You can find it in Tasks or the calendar.' : '.'}`)} />}
    {routineEditor && <RoutineModal planning defaultDate={routineEditor.date} routine={routineEditor.routine} onClose={() => setRoutineEditor(undefined)} onSaved={routine => setNotice(isRoutineAvailableOnDate(routine, date) ? 'Routine saved.' : 'Routine saved. Its schedule does not include tomorrow; you can find it in Daily Routine.')} />}
  </section>;
}
