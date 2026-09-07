import { create } from "zustand";
import { taskRepository } from "../database/repositories/taskRepository";
import type { CreateTaskInput, Task } from "../types/task";

type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  loadTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (task: Task, input: CreateTaskInput) => Promise<Task>;
  toggleTask: (task: Task) => Promise<void>;
  archiveTask: (task: Task) => Promise<void>;
  moveTask: (task: Task, scheduledDate: string) => Promise<void>;
  deleteTask: (task: Task) => Promise<void>;
};

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const dateComparison = left.scheduledDate.localeCompare(right.scheduledDate);
    if (dateComparison !== 0) return dateComparison;
    return (left.dueTime ?? "23:59").localeCompare(right.dueTime ?? "23:59");
  });
}

function errorMessage(error: unknown) {
  if (typeof error === "string") return error;
  return error instanceof Error ? error.message : "Something went wrong while saving your tasks.";
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  loadTasks: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskRepository.listActive();
      set({ tasks, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false, isInitialized: true, error: errorMessage(error) });
    }
  },

  createTask: async (input) => {
    set({ error: null });
    try {
      const task = await taskRepository.create(input);
      set((state) => ({ tasks: sortTasks([...state.tasks, task]) }));
      return task;
    } catch (error) {
      const message = errorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  updateTask: async (task, input) => {
    set({ error: null });
    try {
      const updated = await taskRepository.update(task, input);
      set((state) => ({
        tasks: sortTasks(state.tasks.map((item) => (item.id === updated.id ? updated : item))),
      }));
      return updated;
    } catch (error) {
      const message = errorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  toggleTask: async (task) => {
    set({ error: null });
    try {
      await taskRepository.setCompleted(task, task.status !== "completed");
      const tasks = await taskRepository.listActive();
      set({ tasks });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  archiveTask: async (task) => {
    set({ error: null });
    try {
      await taskRepository.archive(task);
      set((state) => ({ tasks: state.tasks.filter((item) => item.id !== task.id) }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  moveTask: async (task, scheduledDate) => {
    set({ error: null });
    try {
      const updated = await taskRepository.moveToDate(task, scheduledDate);
      set((state) => ({ tasks: sortTasks(state.tasks.map((item) => item.id === task.id ? updated : item)) }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  deleteTask: async (task) => {
    set({ error: null });
    try {
      await taskRepository.deletePermanently(task);
      set((state) => ({ tasks: state.tasks.filter((item) => item.id !== task.id) }));
    } catch (error) {
      const message = errorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },
}));
