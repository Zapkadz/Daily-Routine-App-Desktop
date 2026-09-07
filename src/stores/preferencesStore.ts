import { create } from 'zustand';
import { defaultPreferences, type Preferences } from '../types/preferences';
import { preferencesRepository } from '../database/repositories/preferencesRepository';

export const usePreferencesStore = create<{
  value: Preferences; loaded: boolean; error: string | null;
  load: () => Promise<void>; save: (value: Preferences) => Promise<void>;
}>((set) => ({
  value: structuredClone(defaultPreferences), loaded: false, error: null,
  load: async () => {
    try { set({ value: await preferencesRepository.load(), loaded: true, error: null }); }
    catch (error) { set({ error: String(error) }); }
  },
  save: async (value) => { await preferencesRepository.save(value); set({ value, loaded: true, error: null }); },
}));
