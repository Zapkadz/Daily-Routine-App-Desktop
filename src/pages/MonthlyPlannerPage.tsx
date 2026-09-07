import { addMonths, format, isSameMonth, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CalendarTaskCard } from "../features/calendar/CalendarTaskCard";
import { CalendarToolbar } from "../features/calendar/CalendarToolbar";
import { TaskModal } from "../features/tasks/TaskModal";
import { monthGridDateKeys } from "../services/calendarService";
import { useTaskStore } from "../stores/taskStore";
import type { Task } from "../types/task";
import { localDateKey } from "../utils/date";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthlyPlannerPage() {
  const [anchor, setAnchor] = useState(new Date());
  const [taskDate, setTaskDate] = useState<string>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const dates = useMemo(() => monthGridDateKeys(anchor), [anchor]);
  const tasks = useTaskStore((state) => state.tasks);
  const taskError = useTaskStore((state) => state.error);
  const tasksInitialized = useTaskStore((state) => state.isInitialized);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const moveTask = useTaskStore((state) => state.moveTask);
  const todayKey = localDateKey();

  useEffect(() => {
    if (!tasksInitialized) void loadTasks();
  }, [loadTasks, tasksInitialized]);

  function handleDrop(event: DragEvent<HTMLElement>, date: string) {
    event.preventDefault();
    const task = tasks.find((item) => item.id === event.dataTransfer.getData("text/task-id"));
    if (task && task.scheduledDate !== date) void moveTask(task, date);
  }

  return (
    <section className="page calendar-page monthly-page">
      <header className="page-header compact-header">
        <div><p className="eyebrow">The month at a glance</p><h1>Monthly Planner</h1><p className="header-copy">Spot busy days, open space, and unfinished work.</p></div>
      </header>
      {taskError && <p className="data-error" role="alert">{taskError} <button onClick={() => void loadTasks()}>Retry loading</button></p>}
      <article className="calendar-surface">
        <CalendarToolbar label={format(anchor, "MMMM yyyy")} onPrevious={() => setAnchor((date) => addMonths(date, -1))} onToday={() => setAnchor(new Date())} onNext={() => setAnchor((date) => addMonths(date, 1))} />
        <div className="month-weekdays">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="month-grid">
          {dates.map((date) => {
            const dayTasks = tasks.filter((task) => task.scheduledDate === date && task.status !== "cancelled");
            return (
              <section
                className={`month-day${date === todayKey ? " today" : ""}${!isSameMonth(parseISO(date), anchor) ? " outside" : ""}`}
                key={date}
                onClick={() => { setEditingTask(undefined); setTaskDate(date); }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, date)}
              >
                <header><span>{format(parseISO(date), "d")}</span><Plus size={12} /></header>
                <div className="calendar-task-list month-tasks">
                  {dayTasks.slice(0, 3).map((task) => <CalendarTaskCard key={task.id} task={task} onEdit={(selected) => { setEditingTask(selected); setTaskDate(selected.scheduledDate); }} />)}
                  {dayTasks.length > 3 && <small className="more-count">+{dayTasks.length - 3} more</small>}
                </div>
              </section>
            );
          })}
        </div>
      </article>
      {taskDate && <TaskModal defaultDate={taskDate} task={editingTask} onClose={() => setTaskDate(undefined)} />}
    </section>
  );
}
