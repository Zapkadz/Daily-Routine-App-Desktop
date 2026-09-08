import { create } from "zustand";
import { routineRepository } from "../database/repositories/routineRepository";
import type { CreateRoutineInput, Routine, RoutineLog, RoutineStatus } from "../types/routine";

type RoutineState = {
  routines: Routine[];
  allRoutines: Routine[];
  logsByDate: Record<string, RoutineLog[]>;
  historyLogs: RoutineLog[];
  historyLoading: boolean;
  historyError: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  loadRoutines: () => Promise<void>;
  loadLogs: (date: string) => Promise<void>;
  loadHistory: (startDate: string, endDate: string) => Promise<void>;
  createRoutine: (input: CreateRoutineInput) => Promise<Routine>;
  updateRoutine: (routine: Routine, input: CreateRoutineInput) => Promise<Routine>;
  archiveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (routine: Routine) => Promise<void>;
  setStatus: (routine: Routine, date: string, status: RoutineStatus) => Promise<void>;
  removeDate: (routine: Routine, date: string, removed?: boolean) => Promise<void>;
};

function message(error: unknown) {
  if (typeof error === "string") return error;
  return error instanceof Error ? error.message : "Something went wrong while saving your routines.";
}

function sortRoutines(routines: Routine[]) {
  return [...routines].sort((left, right) => (left.reminderTime ?? "23:59").localeCompare(right.reminderTime ?? "23:59"));
}

let historyRequest = 0;
export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  allRoutines: [],
  logsByDate: {},
  historyLogs: [],
  historyLoading: false,
  historyError: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  loadRoutines: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const allRoutines = await routineRepository.listAll();
      set({ allRoutines, routines: allRoutines.filter(routine => routine.isActive && !routine.archivedAt), isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false, isInitialized: true, error: message(error) });
    }
  },

  loadLogs: async (date) => {
    try {
      const logs = await routineRepository.listLogsForDate(date);
      set((state) => ({ logsByDate: { ...state.logsByDate, [date]: logs } }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  loadHistory: async (startDate, endDate) => {
    const request = ++historyRequest;
    set({ historyLoading: true, historyError: null });
    try {
      const historyLogs = await routineRepository.listLogsBetween(startDate, endDate);
      if (request === historyRequest) set({ historyLogs, historyLoading: false });
    } catch (error) {
      if (request === historyRequest) set({ historyError: message(error), historyLoading: false });
    }
  },

  createRoutine: async (input) => {
    try {
      const routine = await routineRepository.create(input);
      set((state) => ({ routines: sortRoutines([...state.routines, routine]), allRoutines: [...state.allRoutines, routine], error: null }));
      return routine;
    } catch (error) {
      const errorText = message(error);
      set({ error: errorText });
      throw new Error(errorText);
    }
  },

  updateRoutine: async (routine, input) => {
    try {
      const updated = await routineRepository.update(routine, input);
      set((state) => ({ routines: sortRoutines(state.routines.map((item) => item.id === updated.id ? updated : item)), allRoutines: state.allRoutines.map(item => item.id === updated.id ? updated : item), error: null }));
      return updated;
    } catch (error) {
      const errorText = message(error);
      set({ error: errorText });
      throw new Error(errorText);
    }
  },

  archiveRoutine: async (routine) => {
    try {
      await routineRepository.archive(routine);
      const archived = await routineRepository.findById(routine.id);
      set(state => ({ routines: state.routines.filter(item => item.id !== routine.id), allRoutines: state.allRoutines.map(item => item.id === routine.id && archived ? archived : item), error: null }));
    } catch (error) {
      set({ error: message(error) });
      throw new Error(message(error));
    }
  },

  deleteRoutine: async (routine) => {
    try {
      await routineRepository.deletePermanently(routine);
      set((state) => ({ routines: state.routines.filter((item) => item.id !== routine.id), allRoutines: state.allRoutines.filter(item => item.id !== routine.id), error: null }));
    } catch (error) {
      const errorText = message(error);
      set({ error: errorText });
      throw new Error(errorText);
    }
  },

  setStatus: async (routine, date, status) => {
    try {
      const log = await routineRepository.setLogStatus(routine.id, date, status);
      set((state) => {
        const currentLogs = state.logsByDate[date] ?? [];
        const nextLogs = currentLogs.some((item) => item.routineId === routine.id)
          ? currentLogs.map((item) => item.routineId === routine.id ? log : item)
          : [...currentLogs, log];
        return { logsByDate: { ...state.logsByDate, [date]: nextLogs }, error: null };
      });
      const historyLogs = await routineRepository.listLogsBetween(date, date);
      set((state) => ({
        historyLogs: [
          ...state.historyLogs.filter((item) => item.date !== date),
          ...historyLogs,
        ],
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },
  removeDate: async (routine, date, removed = true) => {
    try {
      const updated = await routineRepository.removeDate(routine, date, removed);
      set(state => ({ routines: state.routines.map(item => item.id === updated.id ? updated : item), allRoutines: state.allRoutines.map(item => item.id === updated.id ? updated : item), error: null }));
    } catch (error) { set({error: message(error)}); throw new Error(message(error)); }
  },
}));
