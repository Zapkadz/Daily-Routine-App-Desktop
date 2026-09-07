import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { ProgressRing } from "../components/ProgressRing";
import { TaskModal } from "../features/tasks/TaskModal";
import { TaskRow } from "../features/tasks/TaskRow";
import { RoutineSchedule } from "../features/routines/RoutineSchedule";
import { RoutineModal } from "../features/routines/RoutineModal";
import { isRoutineAvailableOnDate, isRoutineRequiredOnDate } from "../services/routineScheduleService";
import { useRoutineStore } from "../stores/routineStore";
import { useStreakStore } from "../stores/streakStore";
import { useTaskStore } from "../stores/taskStore";
import type { Routine, RoutineStatus } from "../types/routine";
import type { Task } from "../types/task";
import { localDateKey } from "../utils/date";

export function TodayPage() {
  const today = new Date();
  const todayKey = localDateKey(today);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
  const allTasks = useTaskStore((state) => state.tasks);
  const isInitialized = useTaskStore((state) => state.isInitialized);
  const isLoading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const archiveTask = useTaskStore((state) => state.archiveTask);
  const allRoutines = useRoutineStore((state) => state.routines);
  const routineLogsForToday = useRoutineStore((state) => state.logsByDate[todayKey]);
  const routineLogs = routineLogsForToday ?? [];
  const routinesInitialized = useRoutineStore((state) => state.isInitialized);
  const routinesLoading = useRoutineStore((state) => state.isLoading);
  const routineError = useRoutineStore((state) => state.error);
  const loadRoutines = useRoutineStore((state) => state.loadRoutines);
  const loadRoutineLogs = useRoutineStore((state) => state.loadLogs);
  const setRoutineStatus = useRoutineStore((state) => state.setStatus);
  const streakSummary = useStreakStore((state) => state.summary);
  const streakError = useStreakStore((state) => state.error);
  const loadStreaks = useStreakStore((state) => state.loadStreaks);
  const tasks = useMemo(
    () => allTasks.filter((task) => task.scheduledDate === todayKey && task.status !== "cancelled"),
    [allTasks, todayKey],
  );
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const routines = useMemo(
    () => allRoutines.filter((routine) => isRoutineAvailableOnDate(routine, todayKey)),
    [allRoutines, todayKey],
  );
  const requiredRoutines = routines.filter((routine) => {
    const log = routineLogs.find((item) => item.routineId === routine.id);
    return log?.status !== "exempted" && (isRoutineRequiredOnDate(routine, todayKey) || (routine.frequencyType === "weekly_target" && !!log));
  });
  const completedRequiredRoutines = requiredRoutines.filter((routine) => routineLogs.find((log) => log.routineId === routine.id)?.status === "completed").length;
  const totalRequiredItems = tasks.length + requiredRoutines.length;
  const completedRequiredItems = completedTasks + completedRequiredRoutines;
  const todayProgress = totalRequiredItems === 0 ? 0 : Math.round((completedRequiredItems / totalRequiredItems) * 100);

  useEffect(() => {
    if (!isInitialized) void loadTasks();
  }, [isInitialized, loadTasks]);

  useEffect(() => {
    if (!routinesInitialized) void loadRoutines();
    void loadRoutineLogs(todayKey);
  }, [loadRoutineLogs, loadRoutines, routinesInitialized, todayKey]);

  useEffect(() => {
    void loadStreaks(todayKey);
  }, [allTasks, allRoutines, loadStreaks, routineLogsForToday, todayKey]);

  function routineStatus(routine: Routine): RoutineStatus {
    return routineLogs.find((log) => log.routineId === routine.id)?.status ?? "pending";
  }

  return (
    <section className="page today-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{format(today, "EEEE, MMMM d")}</p>
          <h1>Make today meaningful.</h1>
          <p className="header-copy">A clear plan, a steady rhythm, and enough room to breathe.</p>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Previous day"><ChevronLeft size={18} /></button>
          <button className="today-button">Today</button>
          <button className="icon-button" aria-label="Next day"><ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric-card accent-card">
          <div className="metric-icon"><CalendarCheck2 size={20} /></div>
          <span>Planning streak</span>
          <strong>{streakSummary.planningCurrent} days</strong>
          <small>Personal best: {streakSummary.planningLongest} days</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon warm"><Flame size={20} /></div>
          <span>Completion streak</span>
          <strong>{streakSummary.completionCurrent} days</strong>
          <small>Personal best: {streakSummary.completionLongest} days</small>
        </article>
        <article className="metric-card">
          <div className="metric-row">
            <div>
              <span>Today's progress</span>
              <strong>{completedRequiredItems} of {totalRequiredItems}</strong>
              <small>{totalRequiredItems === 0 ? "Add a task and routine" : `${totalRequiredItems - completedRequiredItems} items left`}</small>
            </div>
            <ProgressRing value={todayProgress} />
          </div>
        </article>
        <article className="metric-card quote-card">
          <div className="metric-icon subtle"><Sparkles size={20} /></div>
          <span>Daily intention</span>
          <strong className="intention">Focus on what moves the day forward.</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        {streakError && <p className="data-error dashboard-error" role="alert">{streakError}</p>}
        <article className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your plan</p>
              <h2>Today's tasks</h2>
            </div>
            <Button variant="secondary" icon={<Plus size={17} />} onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}>Add task</Button>
          </div>

          <div className="item-list">
            {error && <div className="data-error" role="alert"><p>Unable to load or update tasks. Your saved data has not been cleared.</p><p>{error}</p><Button variant="secondary" onClick={() => void loadTasks()}>Retry loading</Button></div>}
            {isLoading && <div className="empty-list compact">Loading your tasks...</div>}
            {!isLoading && !error && tasks.length === 0 && (
              <div className="empty-list compact">
                <span>Your day has room for a clear next step.</span>
                <button type="button" onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}>Add today's first task</button>
              </div>
            )}
            {!isLoading && tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={(selectedTask) => { setEditingTask(selectedTask); setShowTaskModal(true); }}
                onArchive={archiveTask}
              />
            ))}
          </div>

          <button className="inline-add" type="button" onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}><Plus size={16} /> Add another task</button>
        </article>

        <article className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily rhythm</p>
              <h2>Schedule</h2>
            </div>
            <Button variant="secondary" icon={<Plus size={17} />} onClick={() => { setEditingRoutine(undefined); setShowRoutineModal(true); }}>Add routine</Button>
          </div>

          <div>
            {routineError && <p className="data-error" role="alert">{routineError}</p>}
            {routinesLoading && <div className="empty-list compact">Loading your routines...</div>}
            {!routinesLoading && routines.length === 0 && (
              <div className="empty-list compact"><span>No routine is scheduled today.</span><button type="button" onClick={() => setShowRoutineModal(true)}>Create a routine</button></div>
            )}
            {!routinesLoading && routines.length > 0 && <RoutineSchedule routines={routines} statusFor={routineStatus}
              onStatusChange={(routine, status) => void setRoutineStatus(routine, todayKey, status)}
              onEdit={(routine) => { setEditingRoutine(routine); setShowRoutineModal(true); }} />}
          </div>
        </article>
      </div>

      <article className="focus-card">
        <div className="focus-icon"><Target size={21} /></div>
        <div>
          <span>Today's focus</span>
          <strong>Finish the planner foundation with care.</strong>
        </div>
        <button className="text-button">Edit intention</button>
      </article>
      {showTaskModal && <TaskModal defaultDate={todayKey} task={editingTask} onClose={() => setShowTaskModal(false)} />}
      {showRoutineModal && <RoutineModal defaultDate={todayKey} routine={editingRoutine} onClose={() => setShowRoutineModal(false)} />}
    </section>
  );
}
