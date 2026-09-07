import { nextOccurrenceDate } from "../../services/recurrenceService";
import type { CreateTaskInput, Task, TaskRecurrence, TaskStatus } from "../../types/task";
import { getDatabase } from "../client";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Task["priority"];
  category_id: string | null;
  category_name: string | null;
  scheduled_date: string;
  due_time: string | null;
  recurrence_rule: TaskRecurrence | null;
  recurrence_source_id: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    categoryId: row.category_id,
    categoryName: row.category_name,
    scheduledDate: row.scheduled_date,
    dueTime: row.due_time,
    recurrenceRule: row.recurrence_rule,
    recurrenceSourceId: row.recurrence_source_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
  };
}

const taskColumns = `
  tasks.id, tasks.title, tasks.description, tasks.status, tasks.priority,
  tasks.category_id, categories.name AS category_name, tasks.scheduled_date,
  tasks.due_time, tasks.recurrence_rule, tasks.recurrence_source_id,
  tasks.created_at, tasks.completed_at, tasks.archived_at
`;

export const taskRepository = {
  async listActive(): Promise<Task[]> {
    const database = await getDatabase();
    const rows = await database.select<TaskRow[]>(
      `SELECT ${taskColumns}
       FROM tasks
       LEFT JOIN categories ON categories.id = tasks.category_id
       WHERE tasks.archived_at IS NULL
       ORDER BY tasks.scheduled_date ASC, COALESCE(tasks.due_time, '23:59') ASC, tasks.created_at ASC`,
    );

    return rows.map(mapTask);
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const database = await getDatabase();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const description = input.description?.trim() || null;
    const dueTime = input.dueTime || null;
    const categoryId = input.categoryId || null;
    const recurrenceRule = input.recurrenceRule || null;

    await database.execute(
      `INSERT INTO tasks (
        id, title, description, status, priority, category_id, scheduled_date,
        due_time, recurrence_rule, created_at, completed_at, archived_at
      ) VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [id, input.title.trim(), description, input.priority, categoryId, input.scheduledDate, dueTime, recurrenceRule, createdAt],
    );

    const task = await taskRepository.findById(id);
    if (!task) throw new Error("The task was created but could not be reloaded.");
    return task;
  },

  async findById(id: string): Promise<Task | null> {
    const database = await getDatabase();
    const rows = await database.select<TaskRow[]>(
      `SELECT ${taskColumns}
       FROM tasks
       LEFT JOIN categories ON categories.id = tasks.category_id
       WHERE tasks.id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0] ? mapTask(rows[0]) : null;
  },

  async update(task: Task, input: CreateTaskInput): Promise<Task> {
    const database = await getDatabase();
    await database.execute(
      `UPDATE tasks
       SET title = ?, description = ?, priority = ?, category_id = ?,
           scheduled_date = ?, due_time = ?, recurrence_rule = ?
       WHERE id = ?`,
      [
        input.title.trim(),
        input.description?.trim() || null,
        input.priority,
        input.categoryId || null,
        input.scheduledDate,
        input.dueTime || null,
        input.recurrenceRule || null,
        task.id,
      ],
    );

    const updated = await taskRepository.findById(task.id);
    if (!updated) throw new Error("The task was updated but could not be reloaded.");
    return updated;
  },

  async setCompleted(task: Task, completed: boolean): Promise<Task> {
    const database = await getDatabase();
    const status: TaskStatus = completed ? "completed" : "todo";
    const completedAt = completed ? new Date().toISOString() : null;

    await database.execute(
      "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?",
      [status, completedAt, task.id],
    );

    if (completed && task.recurrenceRule) {
      const recurrence = task.recurrenceRule;
      await database.execute(
        `INSERT OR IGNORE INTO tasks (
          id, title, description, status, priority, category_id, scheduled_date,
          due_time, recurrence_rule, recurrence_source_id, created_at, completed_at, archived_at
        ) VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        [
          crypto.randomUUID(),
          task.title,
          task.description,
          task.priority,
          task.categoryId,
          nextOccurrenceDate(task.scheduledDate, recurrence),
          task.dueTime,
          recurrence,
          task.id,
          new Date().toISOString(),
        ],
      );
    }

    return { ...task, status, completedAt };
  },

  async archive(task: Task): Promise<void> {
    const database = await getDatabase();
    await database.execute(
      "UPDATE tasks SET archived_at = ? WHERE id = ?",
      [new Date().toISOString(), task.id],
    );
  },

  async moveToDate(task: Task, scheduledDate: string): Promise<Task> {
    const database = await getDatabase();
    await database.execute("UPDATE tasks SET scheduled_date = ? WHERE id = ?", [scheduledDate, task.id]);
    const updated = await taskRepository.findById(task.id);
    if (!updated) throw new Error("The moved task could not be reloaded.");
    return updated;
  },

  async deletePermanently(task: Task): Promise<void> {
    const database = await getDatabase();
    await database.execute("DELETE FROM tasks WHERE id = ?", [task.id]);
  },
};
