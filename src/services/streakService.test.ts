import { describe, expect, it } from "vitest";
import type { StreakData } from "../types/analytics";
import type { Routine, RoutineLog } from "../types/routine";
import { calculateStreaks } from "./streakService";

function dailyRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "routine-1",
    name: "Read",
    description: null,
    icon: null,
    color: "#4f8a68",
    frequencyType: "daily",
    frequencyRule: "{}",
    reminderTime: null,
    isActive: true,
    startDate: "2026-09-01",
    createdAt: "2026-09-01T00:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

function log(date: string, status: RoutineLog["status"] = "completed"): RoutineLog {
  return { id: `log-${date}`, routineId: "routine-1", date, status, completedAt: status === "completed" ? `${date}T10:00:00.000Z` : null, note: null };
}

function data(overrides: Partial<StreakData> = {}): StreakData {
  return {
    today: "2026-09-04",
    routines: [dailyRoutine()],
    tasks: [],
    routineLogs: [],
    ...overrides,
  };
}

describe("calculateStreaks", () => {
  it("requires at least one task and one scheduled routine for planning", () => {
    const result = calculateStreaks(data({ tasks: [{ scheduledDate: "2026-09-04", status: "todo" }] }));
    expect(result.planningCurrent).toBe(1);
    expect(result.completionCurrent).toBe(0);
  });

  it("counts completion only when every required item is complete", () => {
    const result = calculateStreaks(data({
      tasks: [
        { scheduledDate: "2026-09-03", status: "completed" },
        { scheduledDate: "2026-09-04", status: "completed" },
      ],
      routineLogs: [log("2026-09-03"), log("2026-09-04")],
    }));
    expect(result.planningCurrent).toBe(2);
    expect(result.completionCurrent).toBe(2);
  });

  it("does not let an unresolved current day erase yesterday's streak", () => {
    const result = calculateStreaks(data({
      tasks: [
        { scheduledDate: "2026-09-02", status: "completed" },
        { scheduledDate: "2026-09-03", status: "completed" },
      ],
      routineLogs: [log("2026-09-02"), log("2026-09-03")],
    }));
    expect(result.completionCurrent).toBe(2);
  });

  it("breaks a streak on a missing historical date", () => {
    const result = calculateStreaks(data({
      tasks: [
        { scheduledDate: "2026-09-01", status: "completed" },
        { scheduledDate: "2026-09-03", status: "completed" },
      ],
      routineLogs: [log("2026-09-01"), log("2026-09-03")],
    }));
    expect(result.completionCurrent).toBe(1);
    expect(result.completionLongest).toBe(1);
  });

  it("excludes cancelled tasks and exempted routines from completion requirements", () => {
    const result = calculateStreaks(data({
      tasks: [
        { scheduledDate: "2026-09-04", status: "completed" },
        { scheduledDate: "2026-09-04", status: "cancelled" },
      ],
      routineLogs: [log("2026-09-04", "exempted")],
    }));
    expect(result.completionCurrent).toBe(1);
    expect(result.days.at(-1)?.routineTotal).toBe(0);
  });

  it("does not let an unlogged weekly target satisfy planning", () => {
    const weeklyTarget = dailyRoutine({ frequencyType: "weekly_target", frequencyRule: '{"target":3}' });
    const result = calculateStreaks(data({ routines: [weeklyTarget], tasks: [{ scheduledDate: "2026-09-04", status: "completed" }] }));
    expect(result.planningCurrent).toBe(0);
  });
});
