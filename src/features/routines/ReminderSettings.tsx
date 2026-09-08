import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { Button } from '../../components/Button';

type Settings = { enabled: boolean; sound: boolean; background: boolean; autostart: boolean; lastError: string | null };
export type ReminderSettingsService = {
  available: () => boolean;
  load: () => Promise<Settings>;
  save: (value: Pick<Settings, 'enabled' | 'sound' | 'background'>) => Promise<void>;
  autostart: (enabled: boolean) => Promise<void>;
  test: () => Promise<void>;
};
const nativeService: ReminderSettingsService = {
  available: isTauri,
  load: () => invoke('get_reminder_settings'),
  save: value => invoke('save_reminder_settings', value),
  autostart: enabled => invoke('set_reminder_autostart', { enabled }),
  test: () => invoke('test_reminder'),
};

export function ReminderSettings({ service = nativeService }: { service?: ReminderSettingsService }) {
  const [value, setValue] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const desktop = service.available();
  async function load() {
    setError('');
    try { setValue(await service.load()); }
    catch (error) { setError(String(error)); }
  }
  useEffect(() => { if (desktop) void load(); }, [desktop]);
  async function run(action: () => Promise<void>, message: string) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setStatus('');
    try { await action(); setStatus(message); }
    catch (error) { setError(String(error)); }
    finally { locked.current = false; setBusy(false); }
  }
  function change(key: 'enabled' | 'sound' | 'background' | 'autostart', checked: boolean) {
    if (!value) return;
    const next = { ...value, [key]: checked };
    void run(async () => {
      if (key === 'autostart') await service.autostart(checked);
      else await service.save({ enabled: next.enabled, sound: next.sound, background: next.background });
      setValue(next);
    }, 'Reminder settings saved.');
  }
  return <section className="settings-panel" aria-busy={busy}>
    <div className="section-heading"><div><h2>Desktop reminders</h2><p>Get a Windows notification when a planned routine is due.</p></div></div>
    {!desktop ? <p>Open the Windows app to manage desktop reminders.</p> : <>
      <div className="settings-feedback" role="status">{!value && !error ? 'Loading reminder settings…' : status}</div>
      {error && <div className="data-error" role="alert">{error}{!value && <Button variant="secondary" onClick={() => void load()}>Retry</Button>}</div>}
      {value && <>
        <div className="settings-options">{([
          ['enabled', 'Enable desktop reminders', 'Also select “Remind me at this time” on each routine.'],
          ['sound', 'Play a sound', 'Use the Windows notification sound. System volume and Do not disturb still apply.'],
          ['background', 'Keep running when I close the window', 'Find Daily Routine in the system tray. Choose Quit Daily Routine to stop reminders.'],
          ['autostart', 'Start with Windows', 'Start in the system tray when background mode is enabled.'],
        ] as const).map(([key, label, hint]) => <label className="settings-option" key={key}><div><strong>{label}</strong><small>{hint}</small></div><input type="checkbox" checked={value[key]} disabled={busy} onChange={event => change(key, event.target.checked)} /></label>)}</div>
        <p>Reminders follow this computer’s clock and your schedule for each date. Completed, skipped and removed activities are not announced. Missed reminders are only caught up within 5 minutes.</p>
        <p>Use the installed app for Windows notifications. Enable banners for Daily Routine in Windows Settings → System → Notifications. Reminders cannot wake a sleeping or powered-off computer.</p>
        {value.lastError && <p className="data-error" role="alert">Last reminder issue: {value.lastError}</p>}
        <Button variant="secondary" disabled={busy} onClick={() => void run(service.test, 'Test sent to Windows. If no banner appears, check Windows notification settings.')}>Test notification</Button>
      </>}
    </>}
  </section>;
}
