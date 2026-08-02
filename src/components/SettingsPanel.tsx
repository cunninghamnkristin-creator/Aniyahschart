import { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Star, Moon, Gift, KeyRound, ListChecks, BookOpen, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import type { AppState } from '@/lib/useAppState';
import type { BehaviorButton, Milestone, RoutineCategory, RoutineTask, Settings } from '@/lib/types';

interface Props {
  state: AppState;
}

export function SettingsPanel({ state }: Props) {
  const { settings, behaviorButtons, routineTasks, homeschoolTasks } = state;
  const [tab, setTab] = useState<'behavior' | 'routine' | 'homeschool' | 'rewards' | 'pin'>('behavior');
  const [busy, setBusy] = useState(false);

  if (!settings) return null;

  async function updateSettings(patch: Partial<Settings>) {
    setBusy(true);
    await supabase.from('settings').update(patch).eq('id', 1);
    setBusy(false);
    state.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-charcoal-900 text-white p-4">
        <h2 className="font-display font-bold text-xl flex items-center gap-2">
          <SettingsIcon size={22} className="text-ginger-400" /> Settings Master Panel
        </h2>
        <p className="text-sm text-charcoal-300 mt-1">Dynamically rename, add, or delete tasks, adjust point values, change consequences, and update reward milestones.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {([
          ['behavior', 'Behavior Buttons', Zap],
          ['routine', 'Routine Tasks', ListChecks],
          ['homeschool', 'Homeschool', BookOpen],
          ['rewards', 'Rewards', Star],
          ['pin', 'PIN', KeyRound],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === key ? 'bg-ginger-500 text-white' : 'bg-cream-100 text-charcoal-600 hover:bg-charcoal-100'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'behavior' && (
        <BehaviorSettings state={state} busy={busy} setBusy={setBusy} />
      )}
      {tab === 'routine' && (
        <RoutineSettings tasks={routineTasks} busy={busy} setBusy={setBusy} refresh={state.refresh} />
      )}
      {tab === 'homeschool' && (
        <HomeschoolSettings tasks={homeschoolTasks} busy={busy} setBusy={setBusy} refresh={state.refresh} />
      )}
      {tab === 'rewards' && (
        <RewardsSettings settings={settings} updateSettings={updateSettings} busy={busy} />
      )}
      {tab === 'pin' && (
        <PinSettings settings={settings} updateSettings={updateSettings} busy={busy} />
      )}
    </div>
  );
}

function BehaviorSettings({ state, busy, setBusy }: { state: AppState; busy: boolean; setBusy: (b: boolean) => void }) {
  const { behaviorButtons, refresh } = state;
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState(1);
  const [type, setType] = useState<'positive' | 'negative'>('positive');

  async function add() {
    if (!label.trim() || busy) return;
    setBusy(true);
    await supabase.from('behavior_buttons').insert({
      label: label.trim(),
      points: type === 'positive' ? Math.abs(points) : -Math.abs(points),
      type,
      sort_order: behaviorButtons.length + 1,
      is_preset: false,
    });
    setBusy(false);
    setLabel('');
    setAddOpen(false);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('behavior_buttons').delete().eq('id', id);
    refresh();
  }

  async function updatePoints(btn: BehaviorButton, points: number) {
    await supabase.from('behavior_buttons').update({ points: btn.type === 'positive' ? Math.abs(points) : -Math.abs(points) }).eq('id', btn.id);
    refresh();
  }

  async function rename(btn: BehaviorButton, label: string) {
    await supabase.from('behavior_buttons').update({ label }).eq('id', btn.id);
    refresh();
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setAddOpen(true)} className="w-full py-2.5 rounded-xl bg-ginger-500 hover:bg-ginger-600 text-white font-bold text-sm flex items-center justify-center gap-2">
        <Plus size={18} /> Add Behavior Button
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {behaviorButtons.map((b) => (
          <div key={b.id} className="rounded-xl bg-cream-50 border border-charcoal-200 p-3">
            <input
              defaultValue={b.label}
              onBlur={(e) => e.target.value !== b.label && rename(b, e.target.value)}
              className="w-full font-semibold text-sm text-charcoal-800 bg-transparent border-b border-transparent focus:border-ginger-400 outline-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-charcoal-500">Points:</span>
              <input
                type="number"
                defaultValue={Math.abs(b.points)}
                onBlur={(e) => updatePoints(b, Number(e.target.value) || 0)}
                className="w-16 text-center rounded-lg border border-charcoal-200 px-2 py-1 text-sm font-bold"
              />
              <span className={`text-xs font-bold ${b.type === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
                {b.type === 'positive' ? 'Positive' : 'Negative'}
              </span>
              <button onClick={() => remove(b.id)} className="ml-auto text-charcoal-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Behavior Button">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase text-charcoal-500">Type</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setType('positive')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${type === 'positive' ? 'bg-emerald-500 text-white' : 'bg-cream-100'}`}>Positive</button>
              <button onClick={() => setType('negative')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${type === 'negative' ? 'bg-red-500 text-white' : 'bg-cream-100'}`}>Negative</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-charcoal-500">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Button label" className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-charcoal-500">Point Value</label>
            <input type="number" value={points} onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm font-bold" />
          </div>
          <button onClick={add} className="w-full py-3 rounded-2xl font-bold text-white bg-ginger-500 hover:bg-ginger-600">Add Button</button>
        </div>
      </Modal>
    </div>
  );
}

function RoutineSettings({ tasks, busy, setBusy, refresh }: { tasks: RoutineTask[]; busy: boolean; setBusy: (b: boolean) => void; refresh: () => Promise<void> }) {
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('morning');

  async function add() {
    if (!label.trim() || busy) return;
    setBusy(true);
    await supabase.from('routine_tasks').insert({ label: label.trim(), category, sort_order: tasks.length + 1, is_active: true, is_dynamic: false });
    setBusy(false);
    setLabel('');
    setAddOpen(false);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('routine_tasks').delete().eq('id', id);
    refresh();
  }

  async function rename(t: RoutineTask, label: string) {
    await supabase.from('routine_tasks').update({ label }).eq('id', t.id);
    refresh();
  }

  async function toggleActive(t: RoutineTask) {
    await supabase.from('routine_tasks').update({ is_active: !t.is_active }).eq('id', t.id);
    refresh();
  }

  const cats: RoutineCategory[] = ['morning', 'after_school', 'health', 'cleanup', 'nighttime', 'saturday'];

  return (
    <div className="space-y-3">
      <button onClick={() => setAddOpen(true)} className="w-full py-2.5 rounded-xl bg-ginger-500 hover:bg-ginger-600 text-white font-bold text-sm flex items-center justify-center gap-2">
        <Plus size={18} /> Add Routine Task
      </button>
      {cats.map((cat) => {
        const catTasks = tasks.filter((t) => t.category === cat);
        if (catTasks.length === 0) return null;
        return (
          <div key={cat}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-charcoal-500 mb-1.5">{cat.replace('_', ' ')}</h4>
            <ul className="space-y-1.5">
              {catTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-xl bg-cream-50 border border-charcoal-200 px-3 py-2">
                  <input
                    defaultValue={t.label}
                    onBlur={(e) => e.target.value !== t.label && rename(t, e.target.value)}
                    className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-ginger-400 outline-none ${t.is_active ? 'text-charcoal-800' : 'text-charcoal-400 line-through'}`}
                  />
                  <button onClick={() => toggleActive(t)} className={`text-xs font-bold px-2 py-1 rounded ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-charcoal-100 text-charcoal-500'}`}>
                    {t.is_active ? 'On' : 'Off'}
                  </button>
                  <button onClick={() => remove(t.id)} className="text-charcoal-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Routine Task">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase text-charcoal-500">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Task label" className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-charcoal-500">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as RoutineCategory)} className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm">
              {cats.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button onClick={add} className="w-full py-3 rounded-2xl font-bold text-white bg-ginger-500 hover:bg-ginger-600">Add Task</button>
        </div>
      </Modal>
    </div>
  );
}

function HomeschoolSettings({ tasks, busy, setBusy, refresh }: { tasks: import('@/lib/types').HomeschoolTask[]; busy: boolean; setBusy: (b: boolean) => void; refresh: () => Promise<void> }) {
  const [label, setLabel] = useState('');

  async function add() {
    if (!label.trim() || busy) return;
    setBusy(true);
    await supabase.from('homeschool_tasks').insert({ label: label.trim(), sort_order: tasks.length + 1, is_active: true });
    setBusy(false);
    setLabel('');
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('homeschool_tasks').delete().eq('id', id);
    refresh();
  }

  async function rename(t: import('@/lib/types').HomeschoolTask, label: string) {
    await supabase.from('homeschool_tasks').update({ label }).eq('id', t.id);
    refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New homeschool task..." className="flex-1 rounded-xl border border-charcoal-200 px-3 py-2 text-sm" />
        <button onClick={add} className="px-4 rounded-xl bg-ginger-500 hover:bg-ginger-600 text-white font-bold text-sm flex items-center gap-1">
          <Plus size={16} /> Add
        </button>
      </div>
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-xl bg-cream-50 border border-charcoal-200 px-3 py-2">
            <input
              defaultValue={t.label}
              onBlur={(e) => e.target.value !== t.label && rename(t, e.target.value)}
              className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-ginger-400 outline-none text-charcoal-800"
            />
            <button onClick={() => remove(t.id)} className="text-charcoal-300 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RewardsSettings({ settings, updateSettings, busy }: { settings: Settings; updateSettings: (p: Partial<Settings>) => Promise<void>; busy: boolean }) {
  function setStarGoal(v: number) {
    updateSettings({ star_goal: Math.max(1, v) });
  }

  function updateMilestone(idx: number, patch: Partial<Milestone>) {
    const next = settings.reward_milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    updateSettings({ reward_milestones: next });
  }

  function toggleCatNap() {
    updateSettings({ cat_nap_pass: { ...settings.cat_nap_pass, unlocked: !settings.cat_nap_pass.unlocked } });
  }

  function toggleOuting() {
    updateSettings({ special_outing: { ...settings.special_outing, unlocked: !settings.special_outing.unlocked } });
  }

  return (
    <div className="space-y-4">
      {/* Star goal */}
      <div className="rounded-xl bg-cream-50 border border-charcoal-200 p-3">
        <label className="text-xs font-bold uppercase text-charcoal-500 flex items-center gap-1.5"><Star size={14} /> Star Goal</label>
        <div className="flex items-center gap-2 mt-1">
          <input type="number" defaultValue={settings.star_goal} onBlur={(e) => setStarGoal(Number(e.target.value) || 1)} className="w-20 text-center font-display font-bold text-xl rounded-lg border border-charcoal-200 py-1.5" disabled={busy} />
          <span className="text-sm text-charcoal-500">stars to reach the final milestone</span>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-charcoal-500 mb-2 flex items-center gap-1.5"><Star size={14} /> Reward Milestones</h4>
        <div className="space-y-2">
          {settings.reward_milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-cream-50 border border-charcoal-200 px-3 py-2">
              <input
                type="number"
                defaultValue={m.threshold}
                onBlur={(e) => updateMilestone(i, { threshold: Number(e.target.value) || 0 })}
                className="w-16 text-center font-bold rounded-lg border border-charcoal-200 py-1 text-sm"
              />
              <input
                defaultValue={m.label}
                onBlur={(e) => e.target.value !== m.label && updateMilestone(i, { label: e.target.value })}
                className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-ginger-400 outline-none"
              />
              <button
                onClick={() => updateMilestone(i, { unlocked: !m.unlocked })}
                className={`text-xs font-bold px-2 py-1 rounded ${m.unlocked ? 'bg-ginger-100 text-ginger-700' : 'bg-charcoal-100 text-charcoal-500'}`}
              >
                {m.unlocked ? 'Unlocked' : 'Locked'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly / Monthly unlock toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
          <div className="flex items-center gap-2 mb-1"><Moon size={16} className="text-purple-600" /><span className="font-bold text-sm text-charcoal-800">Cat Nap Pass</span></div>
          <p className="text-xs text-charcoal-500 mb-2">45 min extra Friday bedtime</p>
          <button onClick={toggleCatNap} disabled={busy} className={`w-full py-2 rounded-lg text-sm font-bold ${settings.cat_nap_pass.unlocked ? 'bg-purple-500 text-white' : 'bg-cream-100 text-charcoal-600'}`}>
            {settings.cat_nap_pass.unlocked ? 'Unlocked' : 'Mark as Unlocked'}
          </button>
        </div>
        <div className="rounded-xl bg-ginger-50 border border-ginger-200 p-3">
          <div className="flex items-center gap-2 mb-1"><Gift size={16} className="text-ginger-600" /><span className="font-bold text-sm text-charcoal-800">Special Solo Outing</span></div>
          <p className="text-xs text-charcoal-500 mb-2">Low-budget parent/daughter date</p>
          <button onClick={toggleOuting} disabled={busy} className={`w-full py-2 rounded-lg text-sm font-bold ${settings.special_outing.unlocked ? 'bg-ginger-500 text-white' : 'bg-cream-100 text-charcoal-600'}`}>
            {settings.special_outing.unlocked ? 'Unlocked' : 'Mark as Unlocked'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PinSettings({ settings, updateSettings, busy }: { settings: Settings; updateSettings: (p: Partial<Settings>) => Promise<void>; busy: boolean }) {
  const [pin, setPin] = useState(settings.pin);
  const [confirm, setConfirm] = useState(settings.pin);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (pin.length < 4) { setMsg('PIN must be at least 4 digits.'); return; }
    if (pin !== confirm) { setMsg('PINs do not match.'); return; }
    setMsg(null);
    await updateSettings({ pin });
    setMsg('PIN updated!');
  }

  return (
    <div className="rounded-xl bg-cream-50 border border-charcoal-200 p-4 space-y-3">
      <h4 className="font-display font-bold text-charcoal-800 flex items-center gap-2"><KeyRound size={18} className="text-ginger-500" /> Parent PIN</h4>
      <p className="text-sm text-charcoal-500">This PIN unlocks Parent Control Mode. Keep it private from Aniyah.</p>
      <div>
        <label className="text-xs font-bold uppercase text-charcoal-500">New PIN</label>
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm font-bold tracking-widest" />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-charcoal-500">Confirm PIN</label>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm font-bold tracking-widest" />
      </div>
      {msg && <p className="text-sm font-semibold text-ginger-600">{msg}</p>}
      <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-800 text-white font-bold text-sm">Save PIN</button>
    </div>
  );
}
