import type { Category } from "../../types/task";
import { getDatabase } from "../client";

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  is_active: number;
};

export const categoryRepository = {
  async list(): Promise<Category[]> {
    const database = await getDatabase();
    return database.select<CategoryRow[]>(
      "SELECT id, name, color, icon, is_active FROM categories ORDER BY name ASC",
    );
  },
  async save(id: string | null, name: string) {
    const normalized = name.trim();
    if (!normalized || normalized.length > 40) throw new Error('Enter a category name of 1–40 characters.');
    const database = await getDatabase();
    const duplicates = await database.select<{id: string}[]>(
      'SELECT id FROM categories WHERE lower(name)=lower(?) AND id != ?', [normalized, id ?? '']);
    if (duplicates.length) throw new Error('A category with this name already exists.');
    if (id) await database.execute('UPDATE categories SET name=? WHERE id=?', [normalized, id]);
    else await database.execute('INSERT INTO categories(id,name,color,icon,created_at) VALUES (?,?,?,NULL,?)', [crypto.randomUUID(), normalized, '#4f7794', new Date().toISOString()]);
  },
  async setActive(id: string, active: boolean) {
    const database = await getDatabase();
    await database.execute('UPDATE categories SET is_active=? WHERE id=?', [active ? 1 : 0, id]);
  },
};
