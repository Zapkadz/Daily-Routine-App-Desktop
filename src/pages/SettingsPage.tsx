import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { RoutineIcon } from '../components/RoutineIcon';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { useCategoryStore } from '../stores/categoryStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useTaskStore } from '../stores/taskStore';
import type { Category } from '../types/task';

type Editor = { title: string; name: string; symbol?: string; save: (name: string, symbol: string) => Promise<void> };

function OptionEditor({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [name, setName] = useState(editor.name);
  const [symbol, setSymbol] = useState(editor.symbol ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    if (!name.trim() || (editor.symbol !== undefined && !symbol.trim())) {
      setError('Enter a name and, for custom icons, an emoji or symbol.');
      event.currentTarget.querySelector<HTMLInputElement>(!name.trim() ? '[name="name"]' : '[name="symbol"]')?.focus();
      return;
    }
    locked.current = true; setBusy(true); setError('');
    try { await editor.save(name.trim(), symbol.trim()); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <Modal title={editor.title} description="Changes apply everywhere this option is used." onClose={() => { if (!locked.current) onClose(); }}>
    <form className="task-form" noValidate onSubmit={submit} aria-busy={busy}>
      <label className="field field-full"><span>Name</span><input autoFocus name="name" maxLength={40} value={name} disabled={busy} onChange={e => setName(e.target.value)} aria-invalid={!!error && !name.trim()} aria-describedby={error ? 'option-error' : undefined} /></label>
      {editor.symbol !== undefined && <label className="field field-full"><span>Emoji or symbol</span><input name="symbol" maxLength={16} value={symbol} disabled={busy} onChange={e => setSymbol(e.target.value)} placeholder="e.g. 🎸" aria-invalid={!!error && !symbol.trim()} aria-describedby={error ? 'option-error' : undefined} /><small>Use Win + . to open the Windows emoji picker.</small></label>}
      {error && <p className="form-error" id="option-error" role="alert">{error}</p>}
      <div className="form-actions field-full"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>Save changes</Button></div>
    </form>
  </Modal>;
}

export function SettingsPage() {
  const preferences = usePreferencesStore(state => state.value);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  async function load() {
    setLoading(true); setLoadError('');
    try {
      await usePreferencesStore.getState().load();
      const failure = usePreferencesStore.getState().error;
      if (failure) throw new Error(failure);
      setCategories(await categoryRepository.list());
    } catch (error) { setLoadError(String(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function refreshCategories() {
    const values = await categoryRepository.list();
    setCategories(values);
    useCategoryStore.setState({ categories: values, isInitialized: true });
    await useTaskStore.getState().loadTasks();
  }
  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setStatus('');
    try { await action(); setStatus('Changes saved.'); }
    catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { locked.current = false; setBusy(false); }
  }
  function editCategory(category?: Category) {
    setEditor({ title: category ? 'Edit category' : 'Add category', name: category?.name ?? '', save: async name => {
      await categoryRepository.save(category?.id ?? null, name);
      await refreshCategories(); setStatus('Category saved.');
    } });
  }
  const ready = !loading && !loadError;
  return <section className="page settings-page">
    <header className="page-header compact-header"><div><p className="eyebrow">Make it yours</p><h1>Settings</h1><p className="header-copy">Manage the options in your planner. Saved on this computer.</p></div></header>
    <div className="settings-feedback" role="status">{loading ? 'Loading settings…' : status}</div>
    {(loadError || error) && <div className="data-error" role="alert">{loadError ? `Unable to load settings. ${loadError}` : error}{loadError && <Button variant="secondary" onClick={() => void load()}>Retry</Button>}</div>}
    {ready && <div className="settings-sections" aria-busy={busy}>
      <section className="settings-panel"><div className="section-heading"><div><h2>Categories</h2><p>Group your tasks. Hidden categories stay on existing tasks.</p></div><Button variant="secondary" disabled={busy} onClick={() => editCategory()}>Add category</Button></div>
        <div className="settings-options">{categories.length === 0 && <p>No categories yet. Add your first category.</p>}{categories.map(category => <div className="settings-option" key={category.id}><div><strong>{category.name}</strong><small>{category.is_active === 0 ? 'Hidden from new tasks' : 'Available in task forms'}</small></div><div className="settings-actions"><Button variant="ghost" disabled={busy} onClick={() => editCategory(category)}>Edit</Button><Button variant="secondary" disabled={busy} onClick={() => void run(async () => { await categoryRepository.setActive(category.id, category.is_active === 0); await refreshCategories(); })}>{category.is_active === 0 ? 'Show' : 'Hide'}</Button></div></div>)}</div>
      </section>
      <section className="settings-panel"><div className="section-heading"><div><h2>Priority labels</h2><p>Rename the four levels. Their order and existing task values stay unchanged.</p></div></div>
        <div className="settings-options">{(['none', 'low', 'medium', 'high'] as const).map(rank => <div className="settings-option" key={rank}><div><strong>{preferences.priorityLabels[rank]}</strong><small>Fixed level: {rank}</small></div><Button variant="ghost" disabled={busy} onClick={() => setEditor({ title: 'Edit priority label', name: preferences.priorityLabels[rank], save: async name => {
          const current = usePreferencesStore.getState().value;
          if (Object.entries(current.priorityLabels).some(([key, label]) => key !== rank && label.toLowerCase() === name.toLowerCase())) throw new Error('Use a different name for each priority.');
          await usePreferencesStore.getState().save({ ...current, priorityLabels: { ...current.priorityLabels, [rank]: name } }); setStatus('Priority label saved.');
        } })}>Edit</Button></div>)}</div>
      </section>
      <section className="settings-panel"><div className="section-heading"><div><h2>Routine icons</h2><p>Rename or hide built-in icons. Add your own emoji or symbol.</p></div><Button variant="secondary" disabled={busy} onClick={() => setEditor({ title: 'Add routine icon', name: '', symbol: '', save: async (name, symbol) => {
        const current = usePreferencesStore.getState().value;
        await usePreferencesStore.getState().save({ ...current, icons: [...current.icons, { id: crypto.randomUUID(), label: name, symbol, enabled: true }] }); setStatus('Icon saved.');
      } })}>Add icon</Button></div>
        <div className="settings-options">{preferences.icons.map(icon => <div className="settings-option" key={icon.id}><div className="settings-icon-label"><RoutineIcon icon={icon.id} color="#4f8a68" /><div><strong>{icon.label}</strong><small>{icon.enabled ? 'Available in routine forms' : 'Hidden · existing routines keep this icon'}</small></div></div><div className="settings-actions"><Button variant="ghost" disabled={busy} onClick={() => setEditor({ title: 'Edit routine icon', name: icon.label, symbol: ['sparkles','book','activity','droplets','moon','heart'].includes(icon.id) ? undefined : icon.symbol, save: async (name, symbol) => {
          const current = usePreferencesStore.getState().value;
          await usePreferencesStore.getState().save({ ...current, icons: current.icons.map(item => item.id === icon.id ? { ...item, label: name, symbol: symbol || item.symbol } : item) }); setStatus('Icon saved.');
        } })}>Edit</Button><Button variant="secondary" disabled={busy} onClick={() => void run(async () => {
          const current = usePreferencesStore.getState().value;
          if (icon.enabled && current.icons.filter(item => item.enabled).length === 1) throw new Error('Keep at least one icon available.');
          await usePreferencesStore.getState().save({ ...current, icons: current.icons.map(item => item.id === icon.id ? { ...item, enabled: !item.enabled } : item) });
        })}>{icon.enabled ? 'Hide' : 'Show'}</Button></div></div>)}</div>
      </section>
      <section className="settings-panel"><h2>Planner rules</h2><p>English interface · Monday-first weeks · Local calendar dates</p><p>The five routine colors, schedule types, task statuses and streak rules are fixed. Choose a color inside the routine form; its preview updates immediately.</p></section>
    </div>}
    {editor && <OptionEditor editor={editor} onClose={() => setEditor(null)} />}
  </section>;
}
