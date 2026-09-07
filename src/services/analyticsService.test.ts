import { describe, expect, it } from "vitest";
import { calculateAnalytics } from "./analyticsService";
import type { StreakData } from "../types/analytics";

describe("calculateAnalytics", () => {
  it("calculates planning and completion rates from tracked days", () => {
    const data: StreakData = {
      today: "2026-01-03",
      tasks: [
        { scheduledDate: "2026-01-01", status: "completed" },
        { scheduledDate: "2026-01-02", status: "todo" },
      ],
      routines: [{ id: "r1", name: "Read", description: null, icon: null, color: "#39775c", frequencyType: "daily", frequencyRule: "{}", reminderTime: null, isActive: true, startDate: "2026-01-01", createdAt: "2026-01-01T00:00:00Z", archivedAt: null }],
      routineLogs: [
        { id: "l1", routineId: "r1", date: "2026-01-01", status: "completed", completedAt: null, note: null },
        { id: "l2", routineId: "r1", date: "2026-01-02", status: "completed", completedAt: null, note: null },
      ],
    };

    const result = calculateAnalytics(data, 2026);
    expect(result.planningRate).toBe(67);
    expect(result.completionRate).toBe(60);
    expect(result.tasksCompleted).toBe(1);
    expect(result.tasksCompletedThisMonth).toBe(1);
    expect(result.routineStats[0]).toMatchObject({ completed: 2, expected: 3, rate: 67 });
  });

  it("excludes exempted routine occurrences from comparison totals", () => {
    const data: StreakData = {
      today: "2026-01-02",
      tasks: [],
      routines: [{ id: "r1", name: "Walk", description: null, icon: null, color: "#39775c", frequencyType: "daily", frequencyRule: "{}", reminderTime: null, isActive: true, startDate: "2026-01-01", createdAt: "2026-01-01T00:00:00Z", archivedAt: null }],
      routineLogs: [{ id: "l1", routineId: "r1", date: "2026-01-02", status: "exempted", completedAt: null, note: null }],
    };

    expect(calculateAnalytics(data, 2026).routineStats[0]).toMatchObject({ completed: 0, expected: 1, rate: 0 });
  });
});
