import { useMemo, useState } from 'react';
import { Sun, Sunset, Heart, Sparkles, Moon, Coffee, Candy, BedDouble, CheckCircle2, ListTodo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { todayISO, wakeUpTarget, bedtimeWindows, isSaturday } from '@/lib/dates';
import { playHappyMeow, playSadMeow } from '@/lib/audio';
import { PawCheck } from '@/components/PawCheck';
import type { AppState } from '@/lib/useAppState';
import type { RoutineTask } from '@/lib/types';

interface Props {
  state: AppState;
  isParent: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Sun; color: string }> = {
  morning: { label: 'Morning Routine', icon: Sun, color: 'text-amber-600' },
  after_school: { label: 'After-School Routine', icon: Sunset, color: 'text-orange-600' },
  health: { label: 'Health Tracker', icon: Heart, color: 'text-rose-600' },
  cleanup: { label: 'House Cleanup', icon: Sparkles, color: 'text-teal-600' },
  nighttime: { label: 'Nighttime Routine', icon: Moon, color: 'text-indigo-600' },
  saturday: { label: 'Saturday Special', icon: Coffee, color: 'text-purple-600' },
};

export function RoutineTab({ state, isParent }: Props) {
  const { routineTasks, taskCompletions, behaviorEvents, settings } = state;
  const today = todayISO();
  const [busy, setBusy] = useState(false);

  // Build today's task list: active tasks + dynamic (sweet tooth) + Saturday specials
  const todaysTasks = useMemo(() => {
    const base = routineTasks.filter((t) => t.is_active);
    const saturday = isSaturday();
    return base.filter((t) => {
      if (t.category === 'saturday') return saturday;
      // dynamic sweet-tooth task shows if it expires today or later
      if (t.is_dynamic) {
        return !t.expires_on || t.expires_on >= today;
      }
      return true;
    });
  }, [routineTasks, today]);

  const completedIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of taskCompletions) {
      if (c.completion_date === today) set.add(c.task_id);
    }
    return set;
  }, [taskCompletions, today]);

  const todoTasks = todaysTasks.filter((t) => !completedIds.has(t.id));
  const doneTasks = todaysTasks.filter((t) => completedIds.has(t.id));

  // Beverage counter (sweet drinks, max 2) — stored in behavior_events as a special category? 
  // We'll track via localStorage for the counter and add a completion-like record.
  const [beverages, setBeverages] = useState<number>(() => Number(localStorage.getItem(`bev-${today}`) ?? 0));

  async function toggleTask(task: RoutineTask) {
    if (!isParent || busy) return;
    setBusy(true);
    const isDone = completedIds.has(task.id);
    if (isDone) {
      await supabase.from('task_completions').delete().eq('task_id', task.id).eq('completion_date', today);
    } else {
      const { error } = await supabase.from('task_completions').insert({ task_id: task.id, completion_date: today });
      if (!error) playHappyMeow();
    }
    setBusy(false);
    state.refresh();
  }

  async function addSweetToothTask() {
    if (!isParent || busy) return;
    // Add a dynamic task "Brush teeth after eating sweet" expiring today
    const existing = routineTasks.find((t) => t.is_dynamic && t.label === 'Brush teeth after eating sweet' && t.expires_on === today);
    if (existing) return;
    setBusy(true);
    await supabase.from('routine_tasks').insert({
      label: 'Brush teeth after eating sweet',
      category: 'health',
      sort_order: 99,
      is_active: true,
      is_dynamic: true,
      expires_on: today,
    });
    setBusy(false);
    state.refresh();
  }

  async function incrementBeverage() {
    if (!isParent || beverages >= 2) return;
    const next = beverages + 1;
    setBeverages(next);
    localStorage.setItem(`bev-${today}`, String(next));
    if (next >= 2) playSadMeow();
  }

  async function decrementBeverage() {
    if (!isParent || beverages <= 0) return;
    const next = beverages - 1;
    setBeverages(next);
    localStorage.setItem(`bev-${today}`, String(next));
  }

  // End-of-night math: if she misses 2 or fewer total tasks across the day, +3; else -3.
  // This is a parent-triggered button.
  const totalTasksCount = todaysTasks.length;
  const doneCount = doneTasks.length;
  const missedCount = totalTasksCount - doneCount;

  async function runBedtimeMath() {
    if (!isParent || busy) return;
    setBusy(true);
    const pts = missedCount <= 2 ? 3 : -3;
    const desc = `End-of-night math (${missedCount} task${missedCount === 1 ? '' : 's'} missed)`;
    const wasNegative = behaviorEvents.filter((e) => e.event_date === today).reduce((s, e) => s + e.points, 0) < 0;
    await supabase.from('behavior_events').insert({ event_date: today, points: pts, description: desc, category: pts > 0 ? 'positive' : 'negative' });
    if (pts > 0) playHappyMeow(); else playSadMeow();
    setBusy(false);
    state.refresh();
    void wasNegative;
  }

  const bedtime = bedtimeWindows();
  const wake = wakeUpTarget();

  // Group todo tasks by category
  const grouped = useMemo(() => {
    const map = new Map<string, RoutineTask[]>();
    for (const t of todoTasks) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, [todoTasks]);

  return (
    <div className="space-y-4">
      {/* Dynamic info banner */}
      <div className="rounded-2xl bg-charcoal-50 border border-charcoal-200 p-3 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="font-bold text-charcoal-700">Wake up:</span> <span className="text-ginger-600 font-semibold">{wake}</span></span>
          <span><span className="font-bold text-charcoal-700">Bedtime:</span> <span className="text-ginger-600 font-semibold">{bedtime.bed}</span></span>
          <span><span className="font-bold text-charcoal-700">Electronics off:</span> <span className="text-ginger-600 font-semibold">{bedtime.electronics}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TO DO column */}
        <section className="rounded-2xl bg-red-50/60 border-2 border-charcoal-200 p-4">
          <h3 className="font-display font-bold text-charcoal-700 mb-3 flex items-center gap-2">
            <ListTodo size={18} className="text-charcoal-500" /> Still To Do Today
            <span className="ml-auto text-xs font-bold bg-charcoal-200 text-charcoal-700 rounded-full px-2 py-0.5">{todoTasks.length}</span>
          </h3>
          {todoTasks.length === 0 ? (
            <p className="text-sm text-charcoal-400 italic py-4 text-center">All done! Great job!</p>
          ) : (
            <div className="space-y-3">
              {[...grouped.entries()].map(([cat, tasks]) => {
                const meta = CATEGORY_META[cat] ?? { label: cat, icon: ListTodo, color: 'text-charcoal-600' };
                const Icon = meta.icon;
                return (
                  <div key={cat}>
                    <div className={`text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5 ${meta.color}`}>
                      <Icon size={14} /> {meta.label}
                    </div>
                    <ul className="space-y-1.5">
                      {tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-2.5 rounded-xl bg-cream-50 border border-charcoal-200 px-3 py-2">
                          <PawCheck checked={false} onToggle={() => toggleTask(t)} readOnly={!isParent} />
                          <span className="text-sm text-charcoal-700 flex-1">{t.label}</span>
                          {t.is_dynamic && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">sweet</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETED column */}
        <section className="rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 p-4">
          <h3 className="font-display font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} /> Completed Tasks
            <span className="ml-auto text-xs font-bold bg-emerald-200 text-emerald-800 rounded-full px-2 py-0.5">{doneCount}</span>
          </h3>
          {doneTasks.length === 0 ? (
            <p className="text-sm text-charcoal-400 italic py-4 text-center">Nothing completed yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {doneTasks.map((t) => (
                <li key={t.id} className="task-enter flex items-center gap-2.5 rounded-xl bg-cream-50 border border-emerald-200 px-3 py-2">
                  <PawCheck checked onToggle={() => toggleTask(t)} readOnly={!isParent} />
                  <span className="text-sm text-charcoal-500 line-through flex-1">{t.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Beverage & Sweet Tooth trackers */}
      <section className="rounded-2xl bg-cream-50 border border-charcoal-200 p-4">
        <h3 className="font-display font-bold text-charcoal-800 mb-3 flex items-center gap-2">
          <Heart size={18} className="text-rose-500" /> Health Trackers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Beverage counter */}
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-charcoal-700 flex items-center gap-1.5">
                <Coffee size={16} className="text-rose-500" /> Sweet Drinks
              </span>
              <span className={`text-xs font-bold ${beverages >= 2 ? 'text-red-600' : 'text-charcoal-500'}`}>
                {beverages}/2 max
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button disabled={!isParent || beverages <= 0} onClick={decrementBeverage} className="h-8 w-8 rounded-lg bg-charcoal-100 grid place-items-center font-bold disabled:opacity-40">−</button>
              <div className="flex-1 flex gap-1">
                {[0, 1].map((i) => (
                  <div key={i} className={`flex-1 h-8 rounded-lg ${i < beverages ? 'bg-rose-400' : 'bg-rose-100'}`} />
                ))}
              </div>
              <button disabled={!isParent || beverages >= 2} onClick={incrementBeverage} className="h-8 w-8 rounded-lg bg-rose-200 grid place-items-center font-bold disabled:opacity-40">+</button>
            </div>
          </div>

          {/* Sweet tooth button */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="text-sm font-semibold text-charcoal-700 flex items-center gap-1.5 mb-2">
              <Candy size={16} className="text-amber-500" /> Sweet Tooth Tracker
            </div>
            <button
              disabled={!isParent || busy}
              onClick={addSweetToothTask}
              className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-sm font-bold disabled:opacity-50"
            >
              Ate a sweet? Add "Brush teeth" task
            </button>
          </div>
        </div>
      </section>

      {/* Nighttime bedtime evaluation */}
      <section className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
        <h3 className="font-display font-bold text-charcoal-800 mb-2 flex items-center gap-2">
          <BedDouble size={18} className="text-indigo-500" /> Nighttime Bedtime Evaluation
        </h3>
        <div className="text-sm text-charcoal-600 mb-3">
          <span className="font-semibold">In Bed by {bedtime.bed}</span> · <span className="font-semibold">Electronics Off by {bedtime.electronics}</span>
        </div>
        <div className="rounded-xl bg-cream-50 border border-indigo-100 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-charcoal-600">Tasks done today</span>
            <span className="font-bold text-emerald-600">{doneCount}/{totalTasksCount}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-charcoal-600">Missed tasks</span>
            <span className={`font-bold ${missedCount > 2 ? 'text-red-600' : 'text-charcoal-600'}`}>{missedCount}</span>
          </div>
          <div className="mt-2 text-xs text-charcoal-500">
            Miss 2 or fewer → <span className="font-bold text-emerald-600">+3 points</span> · Miss more than 2 → <span className="font-bold text-red-600">−3 points</span>
          </div>
        </div>
        {isParent && (
          <button
            disabled={busy}
            onClick={runBedtimeMath}
            className="mt-3 w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm disabled:opacity-50"
          >
            Run End-of-Night Math ({missedCount <= 2 ? '+3' : '−3'})
          </button>
        )}
      </section>
    </div>
  );
}
