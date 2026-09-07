import type { TaskPriority } from './task';

export type RoutineIconOption = { id: string; label: string; symbol: string; enabled: boolean };
export type Preferences = { priorityLabels: Record<TaskPriority, string>; icons: RoutineIconOption[] };
export const defaultPreferences: Preferences = {
  priorityLabels: { none: 'No priority', low: 'Low', medium: 'Medium', high: 'High' },
  icons: [
    { id: 'sparkles', label: 'Sparkles', symbol: '✦', enabled: true },
    { id: 'book', label: 'Book', symbol: '📖', enabled: true },
    { id: 'activity', label: 'Activity', symbol: '🏃', enabled: true },
    { id: 'droplets', label: 'Water', symbol: '💧', enabled: true },
    { id: 'moon', label: 'Moon', symbol: '☾', enabled: true },
    { id: 'heart', label: 'Health', symbol: '♡', enabled: true },
  ],
};
