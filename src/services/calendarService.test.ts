import { describe, expect, it } from "vitest";
import { monthGridDateKeys, weekDateKeys } from "./calendarService";

describe("calendarService", () => {
  it("builds Monday-first weeks", () => {
    expect(weekDateKeys(new Date(2026, 8, 9))).toEqual([
      "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13",
    ]);
  });

  it("includes leading and trailing days in a Monday-first month grid", () => {
    const dates = monthGridDateKeys(new Date(2026, 8, 1));
    expect(dates[0]).toBe("2026-08-31");
    expect(dates.at(-1)).toBe("2026-10-04");
    expect(dates).toHaveLength(35);
  });
});
