// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RoutineHistory } from './RoutineHistory';
import { RoutineForm } from './RoutineForm';
import { routineSnapshot } from '../../services/routineScheduleService';
import type { Routine } from '../../types/routine';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dates = ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'];
const routine: Routine = { id: 'r1', name: 'Study', description: null, icon: 'book', color: '#4f8a68', frequencyType: 'custom_dates', frequencyRule: '{"dates":["2026-09-07"]}', reminderTime: '08:00', startDate: '2026-09-02', createdAt: '', archivedAt: null, isActive: true };
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 8, 12));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });
async function click(text: string) { await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === text)!.click()); }
async function select(label: string, value: string) { await act(async () => {
  const input = [...host.querySelectorAll('label')].find(item => item.querySelector('span')?.textContent === label)!.querySelector('select')!;
  input.value = value; input.dispatchEvent(new Event('change', { bubbles: true }));
}); }

it('shows exact activities and times per date, including archived schedules and off-day matrix cells', async () => {
  const versioned = { ...routine, archivedAt: '2026-09-08T12:00:00Z', isActive: false,
    occurrences: [{ date: '2026-09-08', removed: false, snapshot: { ...routineSnapshot(routine), name: 'Japanese class', reminderTime: '19:00' } }] };
  await act(async () => root.render(<RoutineHistory routines={[versioned]} logs={[]} dates={dates} loading={false} error={null} onRetry={() => {}} />));
  expect(host.querySelector('table')?.textContent).toContain('19:00Japanese class');
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Monday, September 7, 2026"]')!.click());
  expect(host.querySelector('table')?.textContent).toContain('08:00Study');
  expect(host.querySelector('table')?.textContent).not.toContain('Japanese class');
  await click('By routine');
  expect(host.querySelectorAll('.status-off')).toHaveLength(5);
  expect(host.textContent).toContain('(archived)');
});

it('distinguishes failed history from an empty day and supports retry', async () => {
  const retry = vi.fn();
  await act(async () => root.render(<RoutineHistory routines={[]} logs={[]} dates={dates} loading={false} error="Disk unavailable" onRetry={retry} />));
  expect(host.textContent).not.toContain('No activities');
  await click('Retry history'); expect(retry).toHaveBeenCalledOnce();
});

it('defaults edits to this date and allows deliberate future scope without shifting history dates', async () => {
  const submit = vi.fn(async () => {});
  await act(async () => root.render(<RoutineForm defaultDate="2026-09-09" routine={routine} onCancel={() => {}} onSubmit={submit} />));
  expect(host.querySelector('select')?.value).toBe('date');
  await click('Save changes');
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ editScope: 'date', effectiveDate: '2026-09-09', reminderTime: '08:00' }));
});

it('validates a nonempty custom-date selection and sends the chosen dates', async () => {
  const submit = vi.fn(async () => {});
  await act(async () => root.render(<RoutineForm defaultDate="2026-09-09" routine={{ ...routine, frequencyType: 'daily' }} onCancel={() => {}} onSubmit={submit} />));
  await select('Apply changes to', 'future'); await select('Schedule', 'custom_dates');
  // The historical custom date is not silently rescheduled into the future.
  await click('Save changes');
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('at least one custom date');
  expect(submit).not.toHaveBeenCalled();
  await click('Add date'); await click('Save changes');
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ editScope: 'future', customDates: ['2026-09-09'] }));
});
