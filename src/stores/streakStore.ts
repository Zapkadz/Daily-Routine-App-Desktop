import { create } from "zustand";
import { analyticsRepository } from "../database/repositories/analyticsRepository";
import { calculateStreaks } from "../services/streakService";
import type { StreakSummary } from "../types/analytics";

const emptySummary: StreakSummary = {
  planningCurrent: 0,
  planningLongest: 0,
  completionCurrent: 0,
  completionLongest: 0,
  days: [],
};

type StreakState = {
  summary: StreakSummary;
  isLoading: boolean;
  error: string | null;
  loadStreaks: (today: string) => Promise<void>;
};

export const useStreakStore = create<StreakState>((set) => ({
  summary: emptySummary,
  isLoading: false,
  error: null,
  loadStreaks: async (today) => {
    set({ isLoading: true, error: null });
    try {
      const data = await analyticsRepository.loadStreakData(today);
      set({ summary: calculateStreaks(data), isLoading: false });
    } catch (error) {
      set({
        summary: emptySummary,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to calculate streaks.",
      });
    }
  },
}));
