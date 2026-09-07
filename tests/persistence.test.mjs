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
