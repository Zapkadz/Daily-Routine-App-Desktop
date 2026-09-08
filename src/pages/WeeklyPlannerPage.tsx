import { addWeeks, format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CalendarTaskCard } from "../features/calendar/CalendarTaskCard";
import { CalendarToolbar } from "../features/calendar/CalendarToolbar";
import { TaskModal } from "../features/tasks/TaskModal";
import { weekDateKeys } from "../services/calendarService";
import { isRoutineRequiredOnDate } from "../services/routineScheduleService";
import { useRoutineStore } from "../stores/routineStore";
import { useTaskStore } from "../stores/taskStore";
import type { Task } from "../types/task";
import { localDateKey } from "../utils/date";

export function WeeklyPlannerPage() {
  const [anchor, setAnchor] = useState(new Date());
  const [taskDate, setTaskDate] = useState<string>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const dates = useMemo(() => weekDateKeys(anchor), [anchor]);
  const tasks = useTaskStore((state) => state.tasks);
  const taskError = useTaskStore((state) => state.error);
  const tasksInitialized = useTaskStore((state) => state.isInitialized);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const moveTask = useTaskStore((state) => state.moveTask);
  const routines = useRoutineStore((state) => state.allRoutines);
  const historyLogs = useRoutineStore((state) => state.historyLogs);
  const routinesInitialized = useRoutineStore((state) => state.isInitialized);
  const loadRoutines = useRoutineStore((state) => state.loadRoutines);
  const loadHistory = useRoutineStore((state) => state.loadHistory);
  const todayKey = localDateKey();

  useEffect(() => {
    if (!tasksInitialized) void loadTasks();
    if (!routinesInitialized) void loadRoutines();
    void loadHistory(dates[0], dates[dates.length - 1]);
  }, [dates, loadHistory, loadRoutines, loadTasks, routinesInitialized, tasksInitialized]);

  function handleDrop(event: DragEvent<HTMLElement>, date: string) {
    event.preventDefault();
    const task = tasks.find((item) => item.id === event.dataTransfer.getData("text/task-id"));
    if (task && task.scheduledDate !== date) void moveTask(task, date);
  }

  function routineSummary(date: string) {
    const required = routines.filter((routine) => isRoutineRequiredOnDate(routine, date));
    const completed = required.filter((routine) => historyLogs.find((log) => log.routineId === routine.id && log.date === date)?.status === "completed").length;
    return { required: required.length, completed };
  }

  return (
    <section className="page calendar-page">
      <header className="page-header compact-header">
        <div><p className="eyebrow">See the whole rhythm</p><h1>Weekly Planner</h1><p className="header-copy">Plan from Monday to Sunday and move tasks as your week changes.</p></div>
      </header>
      {taskError && <p className="data-error" role="alert">{taskError} <button onClick={() => void loadTasks()}>Retry loading</button></p>}
      <article className="calendar-surface">
        <CalendarToolbar
          label={`${format(parseISO(dates[0]), "MMM d")} – ${format(parseISO(dates[6]), "MMM d, yyyy")}`}
          onPrevious={() => setAnchor((date) => addWeeks(date, -1))}
          onToday={() => setAnchor(new Date())}
          onNext={() => setAnchor((date) => addWeeks(date, 1))}
        />
        <div className="week-grid">
          {dates.map((date) => {
            const dayTasks = tasks.filter((task) => task.scheduledDate === date && task.status !== "cancelled");
            const routineProgress = routineSummary(date);
            return (
              <section
                className={`week-day${date === todayKey ? " today" : ""}`}
                key={date}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, date)}
              >
                <header><span>{format(parseISO(date), "EEE")}</span><strong>{format(parseISO(date), "d")}</strong></header>
                <button className="calendar-add" type="button" onClick={() => { setEditingTask(undefined); setTaskDate(date); }}><Plus size={13} /> Add task</button>
                <div className="calendar-task-list">
                  {dayTasks.map((task) => <CalendarTaskCard key={task.id} task={task} onEdit={(selected) => { setEditingTask(selected); setTaskDate(selected.scheduledDate); }} />)}
                </div>
                {routineProgress.required > 0 && <footer>{routineProgress.completed}/{routineProgress.required} routines</footer>}
              </section>
            );
          })}
        </div>
      </article>
      {taskDate && <TaskModal defaultDate={taskDate} task={editingTask} onClose={() => setTaskDate(undefined)} />}
    </section>
  );
}
