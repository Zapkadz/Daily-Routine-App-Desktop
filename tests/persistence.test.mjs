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
import { routineOnDate, isRoutineRequiredOnDate } from '../src/services/routineScheduleService';

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
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 7, 12));
  directory = mkdtempSync(join(tmpdir(), 'daily-routine-test-'));
  path = join(directory, 'test.db');
  connect();
  for (const file of readdirSync('src-tauri/migrations').filter(name => name.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join('src-tauri/migrations', file), 'utf8'));
  }
});
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); vi.useRealTimers(); });

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

it('persists reminder opt-in independently for dated and future edits', async () => {
  const input = { name: 'Read', color: '#4f8a68', frequencyType: 'daily', weekdays: [], weeklyTarget: 1, startDate: '2026-09-07', reminderTime: '08:00', reminderEnabled: true };
  const routine = await routineRepository.create(input);
  await routineRepository.update(routine, { ...input, effectiveDate: '2026-09-08', editScope: 'date', reminderTime: '10:00', reminderEnabled: false });
  db.close(); connect();
  const loaded = await routineRepository.findById(routine.id);
  expect(routineOnDate(loaded, '2026-09-07').reminderEnabled).toBe(true);
  expect(routineOnDate(loaded, '2026-09-08').reminderEnabled).toBe(false);
  expect(routineOnDate(loaded, '2026-09-09').reminderEnabled).toBe(true);
  await routineRepository.update(loaded, { ...input, effectiveDate: '2026-09-09', editScope: 'future', reminderEnabled: false });
  expect(routineOnDate(await routineRepository.findById(routine.id), '2026-09-10').reminderEnabled).toBe(false);
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

const routineInput = { name: 'Study', startDate: '2026-09-07', color: '#4f8a68', icon: 'book', frequencyType: 'daily', weekdays: [1, 2, 3, 4, 5], weeklyTarget: 3, reminderTime: '08:00' };

it('persists a single-date edit through restart without changing past or other future dates', async () => {
  const routine = await routineRepository.create(routineInput);
  await routineRepository.setLogStatus(routine.id, '2026-09-07', 'completed');
  await routineRepository.update(routine, { ...routineInput, name: 'Japanese class', reminderTime: '19:00', editScope: 'date', effectiveDate: '2026-09-08' });
  db.close(); connect();
  const loaded = await routineRepository.findById(routine.id);
  expect(routineOnDate(loaded, '2026-09-07')).toMatchObject({ name: 'Study', reminderTime: '08:00' });
  expect(routineOnDate(loaded, '2026-09-08')).toMatchObject({ name: 'Japanese class', reminderTime: '19:00' });
  expect(routineOnDate(loaded, '2026-09-09')).toMatchObject({ name: 'Study', reminderTime: '08:00' });
  expect((await routineRepository.listLogsForDate('2026-09-07'))[0].status).toBe('completed');
  expect(await routineRepository.listLogsForDate('2026-09-08')).toEqual([]);
});

it('versions future schedules, keeps never-opened history and later explicit adjustments', async () => {
  const routine = await routineRepository.create(routineInput);
  await routineRepository.update(routine, { ...routineInput, name: 'Special event', editScope: 'date', effectiveDate: '2026-09-11' });
  await routineRepository.update(routine, { ...routineInput, name: 'Discarded future series', editScope: 'future', effectiveDate: '2026-09-12' });
  await routineRepository.update(routine, { ...routineInput, name: 'New rhythm', reminderTime: '10:00', editScope: 'future', effectiveDate: '2026-09-10' });
  db.close(); connect();
  let loaded = await routineRepository.findById(routine.id);
  expect(routineOnDate(loaded, '2026-09-09').name).toBe('Study');
  expect(routineOnDate(loaded, '2026-09-10').name).toBe('New rhythm');
  expect(routineOnDate(loaded, '2026-09-11').name).toBe('Special event');
  expect(routineOnDate(loaded, '2026-09-12').name).toBe('New rhythm');
  // Changing the series on a date with an override must visibly update that date too.
  loaded = await routineRepository.update(loaded, { ...routineInput, name: 'Replacement', editScope: 'future', effectiveDate: '2026-09-11' });
  expect(routineOnDate(loaded, '2026-09-11').name).toBe('Replacement');
  expect(routineOnDate(loaded, '2026-09-10').name).toBe('New rhythm');
});

it('schedules custom dates, reuses one activity, removes and restores only a date', async () => {
  const routine = await routineRepository.create({ ...routineInput, frequencyType: 'custom_dates', customDates: ['2026-09-08', '2026-09-10'] });
  expect(isRoutineRequiredOnDate(routine, '2026-09-07')).toBe(false);
  expect(isRoutineRequiredOnDate(routine, '2026-09-08')).toBe(true);
  let updated = await routineRepository.update(routine, { ...routineInput, reminderTime: '17:00', editScope: 'date', effectiveDate: '2026-09-09' });
  updated = await routineRepository.removeDate(updated, '2026-09-09');
  expect(isRoutineRequiredOnDate(updated, '2026-09-09')).toBe(false);
  updated = await routineRepository.removeDate(updated, '2026-09-09', false);
  db.close(); connect();
  updated = await routineRepository.findById(routine.id);
  expect(routineOnDate(updated, '2026-09-09').reminderTime).toBe('17:00');
  expect(isRoutineRequiredOnDate(updated, '2026-09-09')).toBe(true);
  expect(isRoutineRequiredOnDate(updated, '2026-09-10')).toBe(true);
  expect(isRoutineRequiredOnDate(updated, '2026-09-11')).toBe(false);
  expect(await routineRepository.listAll()).toHaveLength(1);
  expect(await routineRepository.listLogsBetween('2026-09-07', '2026-09-11')).toEqual([]);
});

it('counts only scheduled custom activities and does not double-count explicit weekly targets', async () => {
  const routine = await routineRepository.create({ ...routineInput, frequencyType: 'custom_dates', customDates: ['2026-09-08'] });
  await taskRepository.create({ title: 'Task', scheduledDate: '2026-09-07', priority: 'none' });
  expect(calculateStreaks(await analyticsRepository.loadStreakData('2026-09-07')).planningCurrent).toBe(0);
  const task = await taskRepository.create({ title: 'Task', scheduledDate: '2026-09-08', priority: 'none' });
  await taskRepository.setCompleted(task, true);
  await routineRepository.setLogStatus(routine.id, '2026-09-08', 'completed');
  expect(calculateStreaks(await analyticsRepository.loadStreakData('2026-09-08')).completionCurrent).toBe(1);
  const weekly = await routineRepository.create({ ...routineInput, frequencyType: 'weekly_target' });
  await routineRepository.update(weekly, { ...routineInput, editScope: 'date', effectiveDate: '2026-09-08' });
  await routineRepository.setLogStatus(weekly.id, '2026-09-08', 'completed');
  const day = calculateStreaks(await analyticsRepository.loadStreakData('2026-09-08')).days.at(-1);
  expect(day).toMatchObject({ routineTotal: 2, routineCompleted: 2, qualifiesForCompletion: true });
  await routineRepository.removeDate(routine, '2026-09-08');
  expect(calculateStreaks(await analyticsRepository.loadStreakData('2026-09-08')).days.at(-1).routineTotal).toBe(1);
});

it('rejects invalid and past schedule mutations without modifying saved history', async () => {
  const routine = await routineRepository.create(routineInput);
  await expect(routineRepository.create({ ...routineInput, startDate: '2026-09-06' })).rejects.toThrow();
  await expect(routineRepository.create({ ...routineInput, frequencyType: 'custom_dates', customDates: ['2026-02-30'] })).rejects.toThrow();
  await expect(routineRepository.update(routine, { ...routineInput, effectiveDate: '2026-09-06' })).rejects.toThrow();
  await expect(routineRepository.removeDate(routine, '2026-09-06')).rejects.toThrow();
  expect((await routineRepository.findById(routine.id)).revisions).toHaveLength(1);
  expect((await routineRepository.findById(routine.id)).occurrences).toEqual([]);
});

it('preserves archived history while excluding future dates after restart', async () => {
  const routine = await routineRepository.create(routineInput);
  await routineRepository.setLogStatus(routine.id, '2026-09-07', 'completed');
  await routineRepository.archive(routine);
  db.close(); connect();
  expect(await routineRepository.listActive()).toEqual([]);
  const archived = (await routineRepository.listAll())[0];
  expect(isRoutineRequiredOnDate(archived, '2026-09-07')).toBe(true);
  expect(isRoutineRequiredOnDate(archived, '2026-09-08')).toBe(false);
  expect((await routineRepository.listLogsForDate('2026-09-07'))[0].status).toBe('completed');
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
});

it('upgrades a populated v5 database without losing routines or completion logs', async () => {
  db.close(); path = join(directory, 'legacy.db'); connect();
  const migrations = readdirSync('src-tauri/migrations').filter(name => name.endsWith('.sql')).sort();
  for (const file of migrations.slice(0, 5)) db.exec(readFileSync(join('src-tauri/migrations', file), 'utf8'));
  db.prepare("INSERT INTO routines(id,name,color,frequency_type,frequency_rule,is_active,start_date,created_at) VALUES('legacy','Lunch','#4f8a68','daily','{}',1,'2026-09-01','2026-09-01T01:00:00Z')").run();
  db.prepare("INSERT INTO routine_logs(id,routine_id,date,status) VALUES('log','legacy','2026-09-02','completed')").run();
  for (const file of migrations.slice(5)) db.exec(readFileSync(join('src-tauri/migrations', file), 'utf8'));
  db.close(); connect();
  const routine = await routineRepository.findById('legacy');
  expect(routineOnDate(routine, '2026-09-02').name).toBe('Lunch');
  expect(isRoutineRequiredOnDate(routine, '2026-08-31')).toBe(false);
  expect((await routineRepository.listLogsForDate('2026-09-02'))[0].status).toBe('completed');
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
});
