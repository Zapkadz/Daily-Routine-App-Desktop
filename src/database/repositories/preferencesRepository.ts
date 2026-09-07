import { getDatabase } from '../client';
import { defaultPreferences, type Preferences } from '../../types/preferences';

export function validatePreferences(value: Preferences): Preferences {
  if (!value || !value.priorityLabels || !Array.isArray(value.icons)) throw new Error('Settings data is invalid. Your saved data has not been changed.');
  const labels = ['none', 'low', 'medium', 'high'].map(key => value.priorityLabels[key as keyof Preferences['priorityLabels']]);
  if (labels.some(label => typeof label !== 'string' || !label.trim() || label.length > 40) || new Set(labels.map(label => label.trim().toLowerCase())).size !== 4) throw new Error('Use four different priority names, each 1–40 characters.');
  if (!value.icons.length || !value.icons.some(icon => icon.enabled) || value.icons.some(icon => !icon || typeof icon.id !== 'string' || !icon.id || typeof icon.label !== 'string' || !icon.label.trim() || icon.label.length > 40 || typeof icon.symbol !== 'string' || !icon.symbol.trim() || icon.symbol.length > 16 || typeof icon.enabled !== 'boolean') || new Set(value.icons.map(icon => icon.id)).size !== value.icons.length) throw new Error('Check icon names and symbols, and keep at least one icon available.');
  return value;
}

export const preferencesRepository = {
  async load(): Promise<Preferences> {
    const db = await getDatabase();
    const rows = await db.select<{value: string}[]>("SELECT value FROM app_preferences WHERE key = 'customization'");
    if (!rows.length) return structuredClone(defaultPreferences);
    return validatePreferences(JSON.parse(rows[0].value) as Preferences);
  },
  async save(value: Preferences) {
    validatePreferences(value);
    const db = await getDatabase();
    await db.execute("INSERT INTO app_preferences(key,value) VALUES ('customization',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [JSON.stringify(value)]);
  },
};
