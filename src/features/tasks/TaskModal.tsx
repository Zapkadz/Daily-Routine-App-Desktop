import { useEffect, useState } from "react";
import { DeleteConfirmation } from "../../components/DeleteConfirmation";
import { Modal } from "../../components/Modal";
import { useCategoryStore } from "../../stores/categoryStore";
import { useTaskStore } from "../../stores/taskStore";
import type { CreateTaskInput, Task } from "../../types/task";
import { TaskForm } from "./TaskForm";

type TaskModalProps = { defaultDate: string; task?: Task; onClose: () => void; onSaved?: (task: Task) => void };

export function TaskModal({ defaultDate, task, onClose, onSaved }: TaskModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    const saved = task ? await updateTask(task, input) : await createTask(input);
    onSaved?.(saved);
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    await deleteTask(task);
    onClose();
  }

  return (
    <><Modal title={task ? "Edit task" : "Add a new task"} description="Give this task a clear place in your day." onClose={onClose}>
      <TaskForm
        defaultDate={defaultDate}
        task={task}
        categories={categories}
        onCancel={onClose}
        onSubmit={handleSubmit}
        onDelete={task ? async () => setConfirmDelete(true) : undefined}
      />
    </Modal>{confirmDelete && task && <DeleteConfirmation name={task.title} onDelete={handleDelete} onClose={() => setConfirmDelete(false)} />}</>
  );
}
