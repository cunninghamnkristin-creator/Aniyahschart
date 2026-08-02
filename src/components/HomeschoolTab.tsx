import { useMemo, useState } from 'react';
import { Star, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { todayISO, prettyDate } from '@/lib/dates';
import { playHappyMeow } from '@/lib/audio';
import { PawCheck } from '@/components/PawCheck';
import type { AppState } from '@/lib/useAppState';

interface Props {
  state: AppState;
  isParent: boolean;
}

// We track per-task completion locally for the homeschool checklist since the
// schema awards a single star per day when the full checklist is done. We
// store a lightweight per-task completion in a separate table-less approach:
// we use the homeschool_completions table (one row per day) as the star source,
// and track individual task check state in component state for the session.
// For persistence of individual checks, we reuse task_completions with a
// synthetic task id mapping is not ideal; instead we keep it simple: the
// parent checks off items and when all are done, a star is awarded.

export function HomeschoolTab({ state, isParent }: Props) {
  const { homeschoolTasks, homeschoolCompletions, settings } = state;
  const today = todayISO();
  const activeTasks = homeschoolTasks.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  // Per-task checked state — persisted in a small JSON column-free way:
  // we store checked task ids in localStorage keyed by date.
  const [checked, setChecked] = useState<Set<string>>(() => loadChecks(today));

  const todayCompletion = homeschoolCompletions.find((c) => c.completion_date === today);
  const starAwarded = !!todayCompletion?.star_awarded;

  const allDone = activeTasks.length > 0 && activeTasks.every((t) => checked.has(t.id));
  const stars = homeschoolCompletions.filter((c) => c.star_awarded).length;
  const starGoal = settings?.star_goal ?? 30;
  const milestones = settings?.reward_milestones ?? [];

  async function toggle(taskId: string) {
    if (!isParent) return;
    const next = new Set(checked);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setChecked(next);
    saveChecks(today, next);

    // If all done and not yet awarded a star today, award it.
    const nowAllDone = activeTasks.every((t) => next.has(t.id));
    if (nowAllDone && !starAwarded) {
      const { error } = await supabase.from('homeschool_completions').upsert(
        { completion_date: today, star_awarded: true },
        { onConflict: 'completion_date' },
      );
      if (!error) {
        playHappyMeow();
        state.refresh();
      }
    } else if (!nowAllDone && starAwarded) {
      // un-award if parent unchecks something
      await supabase.from('homeschool_completions').delete().eq('completion_date', today);
      state.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Star progress hero */}
      <div className="rounded-3xl bg-gradient-to-br from-ginger-400 to-ginger-600 text-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ginger-100">Homeschool Stars</div>
            <div className="font-display font-bold text-5xl mt-1 flex items-center gap-2">
              {stars}
              <Star size={32} fill="currentColor" strokeWidth={0} className="text-yellow-200" />
              <span className="text-lg font-semibold text-ginger-100">/ {starGoal}</span>
            </div>
          </div>
          <div className="grid place-items-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur">
            <BookOpen size={32} />
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-yellow-200 transition-all duration-500"
            style={{ width: `${Math.min(100, (stars / starGoal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Daily checklist */}
      <section className="rounded-2xl bg-cream-50 border border-charcoal-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-charcoal-800 flex items-center gap-2">
            <BookOpen size={18} /> Today's Homeschool Checklist
          </h3>
          {starAwarded && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ginger-600 bg-ginger-50 px-2 py-1 rounded-full">
              <Star size={12} fill="currentColor" strokeWidth={0} /> Star earned!
            </span>
          )}
        </div>
        {activeTasks.length === 0 ? (
          <p className="text-sm text-charcoal-400 italic">No homeschool tasks configured. Add some in Settings.</p>
        ) : (
          <ul className="space-y-2">
            {activeTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-cream-100 border border-charcoal-100 px-3 py-2.5">
                <PawCheck checked={checked.has(t.id)} onToggle={() => toggle(t.id)} readOnly={!isParent} />
                <span className={`text-sm font-medium ${checked.has(t.id) ? 'line-through text-charcoal-400' : 'text-charcoal-700'}`}>
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!isParent && (
          <p className="mt-3 text-xs text-charcoal-400 italic">Ask a parent to check off your homeschool tasks.</p>
        )}
      </section>

      {/* Milestone progress */}
      <section>
        <h3 className="font-display font-bold text-charcoal-800 mb-2 flex items-center gap-2">
          <Award size={18} className="text-ginger-600" /> Reward Milestones
        </h3>
        <div className="space-y-3">
          {milestones.map((m) => {
            const reached = stars >= m.threshold;
            const prev = milestones.filter((x) => x.threshold < m.threshold).pop();
            const prevThreshold = prev?.threshold ?? 0;
            const span = m.threshold - prevThreshold;
            const inSpan = Math.min(span, Math.max(0, stars - prevThreshold));
            const pct = span > 0 ? (inSpan / span) * 100 : 100;
            return (
              <div key={m.threshold} className={`rounded-2xl p-4 border-2 ${reached ? 'bg-ginger-50 border-ginger-400' : 'bg-cream-50 border-charcoal-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`grid place-items-center h-8 w-8 rounded-full ${reached ? 'bg-ginger-500 text-white' : 'bg-charcoal-100 text-charcoal-500'}`}>
                      {reached ? <Star size={16} fill="currentColor" strokeWidth={0} /> : m.threshold}
                    </div>
                    <span className="font-semibold text-charcoal-800 text-sm">{m.label}</span>
                  </div>
                  <span className="text-xs font-bold text-charcoal-500">{m.threshold} stars</span>
                </div>
                <div className="h-2 rounded-full bg-charcoal-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${reached ? 'bg-ginger-500' : 'bg-ginger-300'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {reached && <p className="mt-1 text-xs font-bold text-ginger-600">Unlocked!</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Star history */}
      <section>
        <h3 className="font-display font-bold text-charcoal-700 mb-2">Star History</h3>
        {homeschoolCompletions.length === 0 ? (
          <p className="text-sm text-charcoal-400 italic">No stars earned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {homeschoolCompletions.slice(0, 14).map((c) => (
              <div key={c.id} className="flex items-center gap-1 rounded-full bg-ginger-50 border border-ginger-200 px-2.5 py-1 text-xs">
                <Star size={12} fill="currentColor" strokeWidth={0} className="text-ginger-500" />
                <span className="text-charcoal-600 font-medium">{prettyDate(c.completion_date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function loadChecks(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(`hs-checks-${date}`);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveChecks(date: string, set: Set<string>) {
  try {
    localStorage.setItem(`hs-checks-${date}`, JSON.stringify([...set]));
  } catch { /* ignore */ }
}
