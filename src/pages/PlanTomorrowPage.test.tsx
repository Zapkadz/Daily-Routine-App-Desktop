// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PlanTomorrowPage } from './PlanTomorrowPage';
import { useTaskStore } from '../stores/taskStore';
import { useRoutineStore } from '../stores/routineStore';
import { useCategoryStore } from '../stores/categoryStore';
import { taskRepository } from '../database/repositories/taskRepository';
import { routineRepository } from '../database/repositories/routineRepository';
import type { Task } from '../types/task';
import type { Routine } from '../types/routine';

vi.mock('../database/repositories/taskRepository', () => ({ taskRepository: { create: vi.fn(), listActive: vi.fn(async () => []) } }));
vi.mock('../database/repositories/routineRepository', () => ({ routineRepository: { create: vi.fn(), listActive: vi.fn(async () => []) } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const tomorrow = '2026-09-09';
const task: Task = { id: 't1', title: 'Tomorrow only', scheduledDate: tomorrow, status: 'todo', priority: 'none', dueTime: '08:00', description: null, categoryId: null, categoryName: null, recurrenceRule: null, recurrenceSourceId: null, createdAt: '', completedAt: null, archivedAt: null };
const routine: Routine = { id: 'r1', name: 'Read tomorrow', startDate: tomorrow, frequencyType: 'daily', frequencyRule: '{}', reminderTime: '06:00', color: '#4f8a68', icon: 'book', description: null, isActive: true, createdAt: '', archivedAt: null };
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 8, 22));
  vi.clearAllMocks();
  useTaskStore.setState({ tasks: [], isInitialized: true, isLoading: false, error: null });
  useRoutineStore.setState({ routines: [], isInitialized: true, isLoading: false, error: null });
  useCategoryStore.setState({ categories: [], isInitialized: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });
async function renderPage() { await act(async () => root.render(<MemoryRouter><PlanTomorrowPage /></MemoryRouter>)); }
async function click(name: string) { await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === name)!.click()); }
async function enter(selector: string, text: string) {
  await act(async () => {
    const input = document.querySelector(selector)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('shows only tomorrow, orders routines and offers no completion controls', async () => {
  useTaskStore.setState({ tasks: [task, { ...task, id: 'past', title: 'Today only', scheduledDate: '2026-09-08' }] });
  useRoutineStore.setState({ routines: [routine, { ...routine, id: 'later', name: 'Lunch', reminderTime: '12:00' }, { ...routine, id: 'off', name: 'Monday only', frequencyType: 'weekdays', frequencyRule: '{"weekdays":[1]}' }] });
  await renderPage();
  expect(host.textContent).toContain('Tomorrow only');
  expect(host.textContent).not.toContain('Today only');
  expect(host.textContent).not.toContain('Monday only');
  expect([...host.querySelectorAll('.schedule-event')].map(row => row.textContent)).toEqual(['Read tomorrow', 'Lunch']);
  expect(host.querySelector('select, .check-button')).toBeNull();
  expect(host.querySelector('.routine-summary')?.textContent).toContain('06:00');
});

it('defaults both forms to tomorrow, retains a failed task and saves through the existing stores', async () => {
  vi.mocked(taskRepository.create).mockRejectedValueOnce(new Error('Disk unavailable')).mockResolvedValueOnce(task);
  vi.mocked(routineRepository.create).mockResolvedValueOnce(routine);
  await renderPage(); await click('Add task');
  expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(tomorrow);
  await enter('input:not([type])', task.title);
  await click('Create task');
  expect(document.querySelector('dialog')?.textContent).toContain('Disk unavailable');
  expect(document.querySelector<HTMLInputElement>('input:not([type])')?.value).toBe(task.title);
  await click('Create task');
  expect(document.querySelector('dialog')).toBeNull();
  expect(taskRepository.create).toHaveBeenLastCalledWith(expect.objectContaining({ scheduledDate: tomorrow }));
  expect(host.textContent).toContain(task.title);
  await click('Add routine');
  expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(tomorrow);
  await enter('input:not([type])', routine.name); await click('Create routine');
  expect(routineRepository.create).toHaveBeenCalledWith(expect.objectContaining({ startDate: tomorrow, frequencyType: 'daily' }));
  expect(host.textContent).toContain(routine.name);
});

it('updates tomorrow after midnight while preserving an open form date', async () => {
  await renderPage(); await click('Add task');
  await act(async () => { vi.setSystemTime(new Date(2026, 8, 9, 0, 1)); window.dispatchEvent(new Event('focus')); });
  expect(host.textContent).toContain('Thu, Sep 10, 2026');
  expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe('2026-09-09');
  expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.min).toBe('2026-09-09');
});

it('shows a retryable load failure instead of an empty plan', async () => {
  useTaskStore.setState({ error: 'Disk unavailable' });
  await renderPage();
  expect(host.textContent).toContain('Disk unavailable');
  expect(host.textContent).not.toContain('No tasks planned for tomorrow yet.');
  await click('Retry loading');
  expect(taskRepository.listActive).toHaveBeenCalled();
  expect(host.textContent).toContain('No tasks planned for tomorrow yet.');
});
