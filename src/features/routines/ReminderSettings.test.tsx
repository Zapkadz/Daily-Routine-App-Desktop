// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ReminderSettings, type ReminderSettingsService } from './ReminderSettings';
import { RoutineForm } from './RoutineForm';

const host = document.createElement('div');
document.body.append(host);
let root = createRoot(host);
afterEach(async () => { await act(async () => root.unmount()); root = createRoot(host); });
function service(): ReminderSettingsService {
  return { available: () => true, load: async () => ({enabled:false,sound:true,background:true,autostart:false,lastError:null}), save: vi.fn(async () => {}), autostart: vi.fn(async () => {}), test: vi.fn(async () => {}) };
}
it('keeps persisted value during save, blocks duplicate changes and recovers on failure', async () => {
  const api = service();
  let fail!: (error: Error) => void;
  api.save = vi.fn(() => new Promise<void>((_, reject) => { fail = reject; }));
  await act(async () => root.render(<ReminderSettings service={api} />));
  const checkbox = host.querySelector('input')!;
  await act(async () => checkbox.click());
  expect(checkbox.checked).toBe(false);
  expect(checkbox.disabled).toBe(true);
  checkbox.click(); expect(api.save).toHaveBeenCalledTimes(1);
  await act(async () => fail(new Error('Database busy. Try again.')));
  expect(checkbox.disabled).toBe(false);
  expect(checkbox.checked).toBe(false);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Database busy');
  api.save = vi.fn(async () => {});
  await act(async () => checkbox.click());
  expect(checkbox.checked).toBe(true);
  expect(host.querySelector('[role="status"]')?.textContent).toContain('saved');
});
it('allows retry after load failure without showing guessed settings', async () => {
  const api = service();
  const load = api.load;
  api.load = vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockImplementation(load);
  await act(async () => root.render(<ReminderSettings service={api} />));
  expect(host.querySelector('input')).toBeNull();
  await act(async () => host.querySelector('button')!.click());
  expect(host.querySelectorAll('input')).toHaveLength(4);
});
it('requires a time before opting in to a routine reminder', async () => {
  await act(async () => root.render(<RoutineForm defaultDate="2026-09-08" onCancel={() => {}} onSubmit={async () => {}} />));
  const time = host.querySelector<HTMLInputElement>('input[type="time"]')!;
  const checkbox = host.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  expect(checkbox.disabled).toBe(true);
  async function setTime(value: string) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(time, value);
      time.dispatchEvent(new Event('input', {bubbles:true}));
      time.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }
  await setTime('08:00');
  expect(checkbox.disabled).toBe(false);
  await act(async () => checkbox.click());
  expect(checkbox.checked).toBe(true);
  await setTime('');
  expect(checkbox.disabled).toBe(true);
  expect(checkbox.checked).toBe(false);
});
