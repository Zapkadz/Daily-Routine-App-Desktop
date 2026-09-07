import { useEffect } from "react";
import { Modal } from "../../components/Modal";
import { useCategoryStore } from "../../stores/categoryStore";
import { useTaskStore } from "../../stores/taskStore";
import type { CreateTaskInput, Task } from "../../types/task";
import { TaskForm } from "./TaskForm";

type TaskModalProps = { defaultDate: string; task?: Task; onClose: () => void };

export function TaskModal({ defaultDate, task, onClose }: TaskModalProps) {
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const categories = useCategoryStore((state) => state.categories);
  const categoriesInitialized = useCategoryStore((state) => state.isInitialized);
  const loadCategories = useCategoryStore((state) => state.loadCategories);

  useEffect(() => {
    if (!categoriesInitialized) void loadCategories();
  }, [categoriesInitialized, loadCategories]);

  async function handleSubmit(input: CreateTaskInput) {
    if (task) await updateTask(task, input);
    else await createTask(input);
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    const confirmed = window.confirm(`Permanently delete “${task.title}”? This cannot be undone.`);
    if (!confirmed) return;
    await deleteTask(task);
    onClose();
  }

  return (
    <Modal title={task ? "Edit task" : "Add a new task"} description="Give this task a clear place in your day." onClose={onClose}>
      <TaskForm
        defaultDate={defaultDate}
        task={task}
        categories={categories}
        onCancel={onClose}
        onSubmit={handleSubmit}
        onDelete={task ? handleDelete : undefined}
      />
    </Modal>
  );
}
