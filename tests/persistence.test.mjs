import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const adapter = vi.hoisted(() => ({ current: null }));
vi.mock('../src/database/client', () => ({ getDatabase: async () => adapter.current }));
import { taskRepository } from '../src/database/repositories/taskRepository';
import { routineRepository } from '../src/database/repositories/routineRepository';
import { analyticsRepository } from '../src/database/repositories/analyticsRepository';
import { categoryRepository } from '../src/database/repositories/categoryRepository';
import { preferencesRepository } from '../src/database/repositories/preferencesRepository';
import { calculateStreaks } from '../src/services/streakService';

let db, directory, path;
function connect() {
  db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON');
  adapter.current = {
    select: async (sql, args = []) => db.prepare(sql).all(...args),
    execute: async (sql, args = []) => db.prepare(sql).run(...args),
  };
}
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'daily-routine-test-'));
  path = join(directory, 'test.db');
  connect();
  for (const file of readdirSync('src-tauri/migrations').filter(name => name.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join('src-tauri/migrations', file), 'utf8'));
  }
});
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });

it('reloads tomorrow plans without counting tomorrow in today streaks', async () => {
  const before = calculateStreaks(await analyticsRepository.loadStreakData('2026-09-08'));
  const task = await taskRepository.create({ title: 'Tomorrow', scheduledDate: '2026-09-09', priority: 'none' });
  const routine = await routineRepository.create({ name: 'Tomorrow routine', startDate: '2026-09-09', color: '#4f8a68', frequencyType: 'daily', weekdays: [], weeklyTarget: 1, reminderTime: '06:00' });
  db.close(); connect();
  expect((await taskRepository.findById(task.id)).scheduledDate).toBe('2026-09-09');
  expect((await routineRepository.findById(routine.id)).startDate).toBe('2026-09-09');
  expect(calculateStreaks(await analyticsRepository.loadStreakData('2026-09-08'))).toEqual(before);
  const next = calculateStreaks(await analyticsRepository.loadStreakData('2026-09-09'));
  expect(next.planningCurrent).toBe(1);
  expect(next.completionCurrent).toBe(0);
  expect(await routineRepository.listLogsForDate('2026-09-09')).toEqual([]);
});

it('persists custom labels, icons and category visibility without losing task links', async () => {
  const prefs = await preferencesRepository.load();
  prefs.priorityLabels.high = 'Urgent';
  prefs.icons.push({ id: 'guitar', label: 'Guitar', symbol: '🎸', enabled: true });
  await preferencesRepository.save(prefs);
  await categoryRepository.save(null, 'Music');
  const category = (await categoryRepository.list()).find(item => item.name === 'Music');
  const task = await taskRepository.create({ title: 'Practice', scheduledDate: '2026-09-07', priority: 'high', categoryId: category.id });
  await categoryRepository.save(category.id, 'Practice music');
  await categoryRepository.setActive(category.id, false);
  db.close(); connect();
  expect(await preferencesRepository.load()).toEqual(prefs);
  expect((await taskRepository.findById(task.id)).categoryName).toBe('Practice music');
  expect((await taskRepository.findById(task.id)).priority).toBe('high');
  expect((await categoryRepository.list()).find(item => item.id === category.id).is_active).toBe(0);
  await categoryRepository.setActive(category.id, true);
  expect((await categoryRepository.list()).find(item => item.id === category.id).is_active).toBe(1);
});

it('rejects invalid settings and duplicate categories without overwriting saved data', async () => {
  const prefs = await preferencesRepository.load();
  await preferencesRepository.save(prefs);
  await expect(preferencesRepository.save({ ...prefs, icons: [] })).rejects.toThrow();
  await expect(categoryRepository.save(null, 'work')).rejects.toThrow('already exists');
  expect(await preferencesRepository.load()).toEqual(prefs);
});

it('keeps routine icon and color through restart', async () => {
  const routine = await routineRepository.create({ name: 'Read', icon: 'book', color: '#7b6f9e', frequencyType: 'daily', weekdays: [], weeklyTarget: 1, startDate: '2026-09-07' });
  db.close(); connect();
  const loaded = (await routineRepository.listActive()).find(item => item.id === routine.id);
  expect(loaded.icon).toBe('book');
  expect(loaded.color).toBe('#7b6f9e');
});

it('reloads two tasks after closing the database, including category joins', async () => {
  const first = await taskRepository.create({ title: 'Study', scheduledDate: '2026-09-07', priority: 'none', categoryId: 'builtin-work' });
  const second = await taskRepository.create({ title: 'Read', scheduledDate: '2026-09-07', priority: 'low' });
  db.close(); connect();
  const loaded = await taskRepository.listActive();
  expect(loaded.map(task => task.id)).toEqual(expect.arrayContaining([first.id, second.id]));
  expect(loaded.find(task => task.id === first.id).categoryName).toBe('Work');
  await taskRepository.setCompleted(first, true);
  await taskRepository.moveToDate(second, '2026-09-08');
  db.close(); connect();
  expect((await taskRepository.findById(first.id)).status).toBe('completed');
  expect((await taskRepository.findById(second.id)).scheduledDate).toBe('2026-09-08');
});

it('persists routine logs, archive history, and exactly one next recurring task', async () => {
  const routine = await routineRepository.create({ name: 'Get up', color: '#39775c', frequencyType: 'daily', weekdays: [], weeklyTarget: 1, startDate: '2026-09-07', reminderTime: '06:00' });
  await routineRepository.setLogStatus(routine.id, '2026-09-07', 'completed');
  const task = await taskRepository.create({ title: 'Read', scheduledDate: '2026-09-07', priority: 'none', recurrenceRule: 'daily' });
  await taskRepository.setCompleted(task, true);
  await taskRepository.setCompleted(task, false);
  await taskRepository.setCompleted(task, true);
  db.close(); connect();
  expect((await taskRepository.listActive())).toHaveLength(2);
  expect((await routineRepository.listLogsForDate('2026-09-07'))[0].status).toBe('completed');
  await taskRepository.archive(task);
  expect(await taskRepository.listActive()).toHaveLength(1);
  expect((await analyticsRepository.loadStreakData('2026-09-07')).tasks[0].status).toBe('completed');
});
