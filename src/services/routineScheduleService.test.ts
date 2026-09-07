import { describe, expect, it } from "vitest";
import type { Routine } from "../types/routine";
import { isRoutineAvailableOnDate, isRoutineRequiredOnDate, routineFrequencyLabel, serializeRoutineRule } from "./routineScheduleService";

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "routine-1",
    name: "Read",
    description: null,
    icon: "book",
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

describe("routine scheduling", () => {
  it("does not schedule a routine before its start date", () => {
    expect(isRoutineRequiredOnDate(routine(), "2026-08-31")).toBe(false);
  });

  it("requires daily routines every day from the start date", () => {
    expect(isRoutineRequiredOnDate(routine(), "2026-09-06")).toBe(true);
  });

  it("uses ISO weekdays where Monday is 1 and Sunday is 7", () => {
    const weekdays = routine({ frequencyType: "weekdays", frequencyRule: JSON.stringify({ weekdays: [1, 3, 5] }) });
    expect(isRoutineRequiredOnDate(weekdays, "2026-09-07")).toBe(true);
    expect(isRoutineRequiredOnDate(weekdays, "2026-09-08")).toBe(false);
    expect(routineFrequencyLabel(weekdays)).toBe("Mon, Wed, Fri");
  });

  it("makes weekly targets available but not required on a specific date", () => {
    const target = routine({ frequencyType: "weekly_target", frequencyRule: JSON.stringify({ target: 3 }) });
    expect(isRoutineAvailableOnDate(target, "2026-09-06")).toBe(true);
    expect(isRoutineRequiredOnDate(target, "2026-09-06")).toBe(false);
    expect(routineFrequencyLabel(target)).toBe("3 times per week");
  });

  it("serializes selected weekdays in stable order", () => {
    expect(serializeRoutineRule({ frequencyType: "weekdays", weekdays: [5, 1, 3], weeklyTarget: 1 })).toBe('{"weekdays":[1,3,5]}');
  });
});
