// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { subDays, parseISO } from "date-fns";
import { TaskForm } from "./TaskForm";
import { RoutineForm } from "../routines/RoutineForm";
import { localDateKey } from "../../utils/date";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const host = document.createElement("div");
document.body.append(host);
let root = createRoot(host);

afterEach(async () => {
  await act(async () => root.unmount());
  root = createRoot(host);
  host.replaceChildren();
});

function setDate(value: string) {
  const input = host.querySelector<HTMLInputElement>('input[type="date"]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setText(selector: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

it("sets today's minimum date and rejects a past new task", async () => {
  const onSubmit = vi.fn(async () => {});
  await act(async () => root.render(<TaskForm defaultDate={localDateKey()} categories={[]} onCancel={() => {}} onSubmit={onSubmit} />));
  const input = host.querySelector<HTMLInputElement>('input[type="date"]')!;
  expect(input.min).toBe(localDateKey());
  await act(async () => setText('input:not([type="date"]):not([type="time"])', "Study"));
  await act(async () => setDate(localDateKey(subDays(parseISO(localDateKey()), 1))));
  await act(async () => (host.querySelector('button[type="submit"]') as HTMLButtonElement).click());
  expect(onSubmit).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("Choose today or a future date.");
});

it("sets today's minimum date and rejects a past new routine", async () => {
  const onSubmit = vi.fn(async () => {});
  await act(async () => root.render(<RoutineForm defaultDate={localDateKey()} onCancel={() => {}} onSubmit={onSubmit} />));
  const input = host.querySelector<HTMLInputElement>('input[type="date"]')!;
  expect(input.min).toBe(localDateKey());
  await act(async () => setText('input:not([type="date"]):not([type="time"])', "Study"));
  await act(async () => setDate(localDateKey(subDays(parseISO(localDateKey()), 1))));
  await act(async () => (host.querySelector('button[type="submit"]') as HTMLButtonElement).click());
  expect(onSubmit).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("Choose today or a future start date.");
});
