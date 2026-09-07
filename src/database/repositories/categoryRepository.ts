import type { Category } from "../../types/task";
import { getDatabase } from "../client";

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

export const categoryRepository = {
  async list(): Promise<Category[]> {
    const database = await getDatabase();
    return database.select<CategoryRow[]>(
      "SELECT id, name, color, icon FROM categories ORDER BY name ASC",
    );
  },
};
