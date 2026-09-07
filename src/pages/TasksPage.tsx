import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { TaskModal } from "../features/tasks/TaskModal";
import { TaskRow } from "../features/tasks/TaskRow";
import { filterTasks, type TaskFilter } from "../features/tasks/taskFilters";
import { useTaskStore } from "../stores/taskStore";
import type { Task } from "../types/task";
import { localDateKey } from "../utils/date";

const filters: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

export function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const isInitialized = useTaskStore((state) => state.isInitialized);
  const error = useTaskStore((state) => state.error);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const archiveTask = useTaskStore((state) => state.archiveTask);
  const todayKey = localDateKey();

  useEffect(() => {
    if (!isInitialized) void loadTasks();
  }, [isInitialized, loadTasks]);

  const visibleTasks = useMemo(() => filterTasks(tasks, filter, todayKey), [filter, tasks, todayKey]);

  return (
    <section className="page tasks-page">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Keep things clear</p>
          <h1>Tasks</h1>
          <p className="header-copy">Everything you have planned, in one calm list.</p>
        </div>
        <Button icon={<Plus size={17} />} onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}>Add task</Button>
      </header>
      <div className="filter-tabs" role="tablist" aria-label="Task filters">
        {filters.map((item) => (
          <button className={filter === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
        ))}
      </div>
      <article className="content-card task-list-card">
        {error && <div className="data-error" role="alert"><p>Unable to load or update tasks. Your saved data has not been cleared.</p><p>{error}</p><Button variant="secondary" onClick={() => void loadTasks()}>Retry loading</Button></div>}
        {isLoading && <div className="empty-list">Loading your tasks...</div>}
        {!isLoading && !error && visibleTasks.length === 0 && (
          <div className="empty-list"><span>No tasks here yet.</span><button type="button" onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}>Create your first task</button></div>
        )}
        {!isLoading && visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            showDate
            onToggle={toggleTask}
            onEdit={(selectedTask) => { setEditingTask(selectedTask); setShowTaskModal(true); }}
            onArchive={archiveTask}
          />
        ))}
      </article>
      {showTaskModal && <TaskModal defaultDate={todayKey} task={editingTask} onClose={() => setShowTaskModal(false)} />}
    </section>
  );
}
