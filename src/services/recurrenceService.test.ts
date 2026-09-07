import { describe, expect, it } from "vitest";
import { nextOccurrenceDate } from "./recurrenceService";

describe("nextOccurrenceDate", () => {
  it("moves daily tasks across month boundaries", () => {
    expect(nextOccurrenceDate("2026-09-30", "daily")).toBe("2026-10-01");
  });

  it("moves weekly tasks across year boundaries", () => {
    expect(nextOccurrenceDate("2026-12-28", "weekly")).toBe("2027-01-04");
  });

  it("clamps monthly tasks to the last valid day", () => {
    expect(nextOccurrenceDate("2027-01-31", "monthly")).toBe("2027-02-28");
  });

  it("handles leap-year monthly recurrence", () => {
    expect(nextOccurrenceDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });
});
