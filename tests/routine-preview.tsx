// Isolated, explicitly labeled component fixture; never loaded by the production entry.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { RoutineHistory } from '../src/features/routines/RoutineHistory';
import { RoutineForm } from '../src/features/routines/RoutineForm';
import { RoutineLibrary } from '../src/features/routines/RoutineLibrary';
import { ReminderSettings, type ReminderSettingsService } from '../src/features/routines/ReminderSettings';
import { Modal } from '../src/components/Modal';
import { Button } from '../src/components/Button';
import { routineSnapshot } from '../src/services/routineScheduleService';
import { localDateKey, tomorrowDateKey } from '../src/utils/date';
import type { Routine } from '../src/types/routine';
import { addDays, parseISO } from 'date-fns';
import '../src/styles/global.css';
import '../src/styles/planner.css';

const today = localDateKey();
let reminderValues = { enabled: false, sound: true, background: true, autostart: false, lastError: null };
const reminderFixture: ReminderSettingsService = {
  available: () => true,
  load: async () => reminderValues,
  save: async value => { reminderValues = { ...reminderValues, ...value }; },
  autostart: async () => { throw new Error('Test startup registration failed. Try again.'); },
  test: async () => {},
};
const dates = Array.from({ length: 7 }, (_, i) => localDateKey(addDays(parseISO(today), i - 6)));
const base: Routine = { id: 'study', name: 'Học tiếng Nhật', description: null, icon: 'book', color: '#4f7794', frequencyType: 'custom_dates', frequencyRule: JSON.stringify({ dates: [dates[3], dates[5]] }), startDate: dates[0], reminderTime: '08:00', isActive: true, createdAt: '', archivedAt: null };
const routines: Routine[] = [
  { ...base, occurrences: [{ date: today, removed: false, snapshot: { ...routineSnapshot(base), name: 'Học Online (N2) · Japanese conversation practice', reminderTime: '19:00' } }] },
  { ...base, id: 'wake', name: 'Thức dậy', frequencyType: 'daily', frequencyRule: '{}', reminderTime: '06:00', color: '#4f8a68', icon: 'sparkles' },
  { ...base, id: 'gym', name: 'Tập Gym', frequencyRule: JSON.stringify({ dates: [dates[2], dates[4]] }), reminderTime: '17:00', icon: 'activity' },
];
function Fixture() {
  const [dark, setDark] = useState(false);
  const [editing, setEditing] = useState<Routine>();
  const [notice, setNotice] = useState('');
  return <div className={`app-frame${dark ? ' dark' : ''}`} style={{ display: 'block', minHeight: '100vh' }}><main className="page">
    <div className="section-heading"><h1>Routine component QA fixture</h1><Button onClick={() => setDark(!dark)}>Toggle theme</Button></div>
    <p className="planning-note">Synthetic data for visual checks only. Saves intentionally fail to exercise input recovery; SQLite persistence is tested separately.</p>
    <ReminderSettings service={reminderFixture} />
    <RoutineHistory routines={routines} logs={[{ id: 'log', routineId: 'wake', date: today, status: 'completed', completedAt: null, note: null }]} dates={dates} loading={false} error={null} onRetry={() => {}} />
    <RoutineLibrary routines={routines} date={tomorrowDateKey(today)} onSchedule={setEditing} />
    <p role="status">{notice}</p>
    {editing && <Modal title="Edit routine" onClose={() => setEditing(undefined)}><RoutineForm routine={editing} defaultDate={tomorrowDateKey(today)} onCancel={() => setEditing(undefined)} onSubmit={async () => { setNotice('Test save attempted'); throw new Error('Test database unavailable. Your input is kept.'); }} /></Modal>}
  </main></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
