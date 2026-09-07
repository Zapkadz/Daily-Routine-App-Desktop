// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { RoutineSchedule } from "./RoutineSchedule";
import type { Routine } from "../../types/routine";

it("orders daily events by time and reports completion for the selected event", async () => {
  const base = { description: null, icon: null, color: "#39775c", frequencyType: "daily", frequencyRule: "{}", isActive: true, startDate: "2026-09-07", createdAt: "2026-09-07T00:00:00Z", archivedAt: null } as const;
  const routines: Routine[] = [
    { ...base, id: "lunch", name: "Lunch", reminderTime: "12:00" },
    { ...base, id: "wake", name: "Get up", reminderTime: "06:00" },
  ];
  const onStatusChange = vi.fn();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<RoutineSchedule routines={routines} statusFor={() => "pending"} onStatusChange={onStatusChange} onEdit={() => {}} />));
  expect([...host.querySelectorAll(".schedule-event")].map((element) => element.textContent)).toEqual(["Get up", "Lunch"]);
  const select = host.querySelector("select")!;
  await act(async () => { select.value = "completed"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  expect(onStatusChange).toHaveBeenCalledWith(routines[1], "completed");
  await act(async () => root.unmount());
  host.remove();
});
