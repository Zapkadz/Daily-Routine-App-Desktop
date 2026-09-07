import { describe, expect, it } from "vitest";
import type { Task } from "../../types/task";
import { filterTasks } from "./taskFilters";

function task(id: string, scheduledDate: string, status: Task["status"] = "todo"): Task {
  return {
    id,
    title: id,
    description: null,
    status,
    priority: "none",
    categoryId: null,
    categoryName: null,
    scheduledDate,
    dueTime: null,
    recurrenceRule: null,
    recurrenceSourceId: null,
    createdAt: "2026-09-06T00:00:00.000Z",
    completedAt: status === "completed" ? "2026-09-06T01:00:00.000Z" : null,
    archivedAt: null,
  };
}

const tasks = [
  task("past", "2026-09-05"),
  task("today", "2026-09-06"),
  task("future", "2026-09-07"),
  task("completed-past", "2026-09-04", "completed"),
];

describe("filterTasks", () => {
  it("returns only tasks scheduled today", () => {
    expect(filterTasks(tasks, "today", "2026-09-06").map((item) => item.id)).toEqual(["today"]);
  });

  it("excludes completed tasks from overdue and upcoming", () => {
    expect(filterTasks(tasks, "overdue", "2026-09-06").map((item) => item.id)).toEqual(["past"]);
    expect(filterTasks(tasks, "upcoming", "2026-09-06").map((item) => item.id)).toEqual(["future"]);
  });

  it("returns completed tasks independently of date", () => {
    expect(filterTasks(tasks, "completed", "2026-09-06").map((item) => item.id)).toEqual(["completed-past"]);
  });
});
