// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { RoutineForm } from '../features/routines/RoutineForm';
import { usePreferencesStore } from '../stores/preferencesStore';
import { defaultPreferences } from '../types/preferences';

vi.mock('../database/repositories/categoryRepository', () => ({ categoryRepository: { list: async () => [{ id: 'work', name: 'Work', is_active: 1 }], save: vi.fn(), setActive: vi.fn() } }));
vi.mock('../database/repositories/preferencesRepository', () => ({ preferencesRepository: { load: async () => structuredClone(defaultPreferences), save: vi.fn() } }));
const host = document.createElement('div');
document.body.append(host);
let root = createRoot(host);
afterEach(async () => { await act(async () => root.unmount()); root = createRoot(host); usePreferencesStore.setState({ value: structuredClone(defaultPreferences), loaded: false, error: null }); });
function click(label: string) { const button = [...document.querySelectorAll('button')].find(item => item.textContent === label)!; button.click(); }

it('loads settings, edits a priority label, and only closes after saving', async () => {
  await act(async () => root.render(<SettingsPage />));
  expect(host.textContent).toContain('Categories');
  expect(host.textContent).toContain('Routine icons');
  const row = [...host.querySelectorAll('.settings-option')].find(item => item.textContent?.includes('Fixed level: high'))!;
  await act(async () => (row.querySelector('button') as HTMLButtonElement).click());
  const input = document.querySelector('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Urgent');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => click('Save changes'));
  expect(usePreferencesStore.getState().value.priorityLabels.high).toBe('Urgent');
  expect(document.querySelector('dialog')).toBeNull();
  expect(host.textContent).toContain('Priority label saved.');
});

it('keeps the icon editor open and focuses missing name on invalid save', async () => {
  await act(async () => root.render(<SettingsPage />));
  await act(async () => click('Add icon'));
  await act(async () => click('Save changes'));
  expect(document.querySelector('[role="alert"]')?.textContent).toContain('Enter a name');
  expect(document.activeElement?.getAttribute('name')).toBe('name');
});

it('updates routine color and icon preview when selections change', async () => {
  await act(async () => root.render(<RoutineForm defaultDate="2026-09-07" onCancel={() => {}} onSubmit={async () => {}} />));
  const selects = host.querySelectorAll('select');
  await act(async () => { selects[0].value = 'book'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); selects[1].value = '#7b6f9e'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); });
  expect(host.querySelector('.routine-preview .routine-icon svg')).not.toBeNull();
  expect((host.querySelector('.routine-icon') as HTMLElement).style.color).toBe('rgb(123, 111, 158)');
});
