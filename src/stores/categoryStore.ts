import { create } from "zustand";
import { categoryRepository } from "../database/repositories/categoryRepository";
import type { Category } from "../types/task";

type CategoryState = {
  categories: Category[];
  isInitialized: boolean;
  loadCategories: () => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isInitialized: false,
  loadCategories: async () => {
    if (get().isInitialized) return;
    try {
      const categories = await categoryRepository.list();
      set({ categories, isInitialized: true });
    } catch {
      set({ categories: [], isInitialized: true });
    }
  },
}));
