import { useMemo, useState } from 'react';
import { Plus, Minus, Sparkles, Calendar, Gift, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { todayISO, prettyDate, dayName } from '@/lib/dates';
import { playHappyMeow, playSadMeow } from '@/lib/audio';
import { Modal } from '@/components/Modal';
import type { AppState } from '@/lib/useAppState';
import type { BehaviorButton, BehaviorCategory } from '@/lib/types';

interface Props {
  state: AppState;
  isParent: boolean;
  onPointsChanged: (wasNegative: boolean, isNegative: boolean) => void;
}

export function BehaviorTab({ state, isParent, onPointsChanged }: Props) {
  const { behaviorButtons, behaviorEvents, dailyReports, settings } = state;
  const [customOpen, setCustomOpen] = useState<null | 'good' | 'bad'>(null);
  const [makeupOpen, setMakeupOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const todayEvents = useMemo(
    () => behaviorEvents.filter((e) => e.event_date === today),
    [behaviorEvents, today],
  );
  const dailyScore = todayEvents.reduce((s, e) => s + e.points, 0);

  const positives = behaviorButtons.filter((b) => b.type === 'positive').sort((a, b) => a.sort_order - b.sort_order);
  const negatives = behaviorButtons.filter((b) => b.type === 'negative').sort((a, b) => a.sort_order - b.sort_order);

  async function logEvent(points: number, description: string, category: BehaviorCategory) {
    setBusy(true);
    const wasNegative = dailyScore < 0;
    const { error } = await supabase.from('behavior_events').insert({
      event_date: today,
      points,
      description,
      category,
    });
    setBusy(false);
    if (error) return;
    const newScore = dailyScore + points;
    const isNegative = newScore < 0;
    if (points > 0) playHappyMeow();
    else playSadMeow();
    onPointsChanged(wasNegative, isNegative);
    state.refresh();
  }

  async function applyButton(btn: BehaviorButton) {
    await logEvent(btn.points, btn.label, btn.type === 'positive' ? 'positive' : 'negative');
  }

  // Strike logic: derived from daily score
  const strikes = (settings?.strike_config ?? []).filter((s) => dailyScore <= s.threshold);

  // Weekly reward: net positive by Sunday
  const isSunday = new Date().getDay() === 0;
  const weekEvents = behaviorEvents.filter((e) => {
    const d = new Date(e.event_date + 'T00:00:00');
    // same week as today
    const now = new Date();
    const dayNum = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayNum);
    monday.setHours(0, 0, 0, 0);
    return d >= monday;
  });
  const weekNet = weekEvents.reduce((s, e) => s + e.points, 0);
  const catNapUnlocked = settings?.cat_nap_pass?.unlocked ?? false;

  // Monthly reward: mostly green days
  const monthReports = dailyReports.filter((r) => r.report_date.startsWith(today.slice(0, 7)));
  const greenCount = monthReports.filter((r) => r.status === 'green').length;
  const totalReports = monthReports.length;
  const monthlyEligible = totalReports >= 10 && greenCount / Math.max(totalReports, 1) >= 0.7;
  const outingUnlocked = settings?.special_outing?.unlocked ?? false;

  return (
    <div className="space-y-4">
      {/* Daily score hero */}
      <div className="rounded-3xl bg-gradient-to-br from-charcoal-800 to-charcoal-950 text-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ginger-300">{dayName()} · Live Daily Balance</div>
            <div className="font-display font-bold text-5xl mt-1">
              {dailyScore > 0 ? '+' : ''}{dailyScore}
              <span className="text-lg font-semibold text-charcoal-300 ml-1">points</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-charcoal-300 font-semibold">Resets at midnight</div>
            <div className="text-2xl font-display font-bold text-ginger-400">{todayEvents.length}</div>
            <div className="text-[10px] text-charcoal-400 uppercase">actions today</div>
          </div>
        </div>
      </div>

      {/* Parent Discretion Makeup Points banner */}
      <div className="rounded-2xl bg-ginger-50 border-2 border-ginger-300 p-4">
        <div className="flex items-start gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-ginger-500 text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-ginger-800">Parent Discretion Makeup Points</h3>
            <p className="text-sm text-charcoal-600 mt-0.5">
              You can earn Makeup Points to fix negative balances or clear active strikes, but these are granted
              entirely at Parent Discretion based on exceptional effort, an excellent attitude shift, or special
              extra helpful tasks.
            </p>
            {isParent && (
              <button
                onClick={() => setMakeupOpen(true)}
                disabled={busy}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold bg-ginger-500 hover:bg-ginger-600 text-white px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <Plus size={16} /> Grant Makeup Points
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Positive buttons */}
      <section>
        <h3 className="font-display font-bold text-emerald-700 mb-2 flex items-center gap-2">
          <Plus size={18} /> Positive Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {positives.map((b) => (
            <button
              key={b.id}
              disabled={!isParent || busy}
              onClick={() => applyButton(b)}
              className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-left hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-semibold text-charcoal-700 text-sm">{b.label}</span>
              <span className="font-display font-bold text-emerald-600 shrink-0">+{b.points}</span>
            </button>
          ))}
          <button
            disabled={!isParent || busy}
            onClick={() => setCustomOpen('good')}
            className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-100 border-2 border-dashed border-emerald-400 px-4 py-3 text-left hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            <span className="font-semibold text-emerald-700 text-sm">Miscellaneous Good Action</span>
            <Plus size={18} className="text-emerald-600" />
          </button>
        </div>
      </section>

      {/* Negative buttons */}
      <section>
        <h3 className="font-display font-bold text-red-700 mb-2 flex items-center gap-2">
          <Minus size={18} /> Accountability Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {negatives.map((b) => (
            <button
              key={b.id}
              disabled={!isParent || busy}
              onClick={() => applyButton(b)}
              className="flex items-center justify-between gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-left hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-semibold text-charcoal-700 text-sm">{b.label}</span>
              <span className="font-display font-bold text-red-600 shrink-0">{b.points}</span>
            </button>
          ))}
          <button
            disabled={!isParent || busy}
            onClick={() => setCustomOpen('bad')}
            className="flex items-center justify-between gap-2 rounded-2xl bg-red-100 border-2 border-dashed border-red-400 px-4 py-3 text-left hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <span className="font-semibold text-red-700 text-sm">Miscellaneous Bad Behavior</span>
            <Minus size={18} className="text-red-600" />
          </button>
        </div>
      </section>

      {/* Active strikes */}
      <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
        <h3 className="font-display font-bold text-red-700 mb-2">Active Accountability Strikes</h3>
        {strikes.length === 0 ? (
          <p className="text-sm text-charcoal-500">No active strikes. Keep up the great work!</p>
        ) : (
          <ul className="space-y-2">
            {strikes.map((s) => (
              <li key={s.threshold} className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">!</span>
                {s.label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-xs text-charcoal-500">
          Strike tiers: -2 = Screen Time Suspension · -5 = Dedicated Household Contribution · -8 = Advanced Bedtime
        </div>
      </section>

      {/* Reward trackers */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`rounded-2xl p-4 border ${catNapUnlocked ? 'bg-purple-50 border-purple-300' : 'bg-charcoal-50 border-charcoal-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Moon size={18} className="text-purple-600" />
            <h3 className="font-display font-bold text-charcoal-800">Weekly Reward</h3>
          </div>
          <p className="text-sm font-semibold text-charcoal-700">Cat Nap Pass</p>
          <p className="text-xs text-charcoal-500 mb-2">45 min extra Friday bedtime if net positive by Sunday</p>
          <div className="text-sm">
            <span className="font-bold text-charcoal-800">Week net: </span>
            <span className={`font-display font-bold ${weekNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {weekNet > 0 ? '+' : ''}{weekNet}
            </span>
            {isSunday && <span className="ml-2 text-xs text-charcoal-500">(Sunday check)</span>}
          </div>
          {catNapUnlocked && <p className="mt-1 text-xs font-bold text-purple-600">Unlocked!</p>}
        </div>

        <div className={`rounded-2xl p-4 border ${outingUnlocked ? 'bg-ginger-50 border-ginger-300' : 'bg-charcoal-50 border-charcoal-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-ginger-600" />
            <h3 className="font-display font-bold text-charcoal-800">Monthly Reward</h3>
          </div>
          <p className="text-sm font-semibold text-charcoal-700">Special Solo Outing</p>
          <p className="text-xs text-charcoal-500 mb-2">Ice cream or park trip for mostly Green days</p>
          <div className="text-sm">
            <span className="font-bold text-charcoal-800">Green days: </span>
            <span className="font-display font-bold text-emerald-600">{greenCount}</span>
            <span className="text-charcoal-400 text-xs"> / {totalReports} logged</span>
          </div>
          {monthlyEligible && !outingUnlocked && <p className="mt-1 text-xs font-bold text-ginger-600">Eligible — unlock in settings!</p>}
          {outingUnlocked && <p className="mt-1 text-xs font-bold text-ginger-600">Unlocked!</p>}
        </div>
      </section>

      {/* End of day report */}
      <section className="rounded-2xl bg-cream-100 border border-charcoal-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-charcoal-600" />
            <h3 className="font-display font-bold text-charcoal-800">End-of-Day Progress Report</h3>
          </div>
          {isParent && (
            <button onClick={() => setReportOpen(true)} className="text-sm font-bold text-ginger-600 hover:text-ginger-700">
              Close out today
            </button>
          )}
        </div>
        <DailyReportView reports={dailyReports} today={today} />
      </section>

      {/* Today's action log */}
      <section>
        <h3 className="font-display font-bold text-charcoal-700 mb-2">Today's Action Log</h3>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-charcoal-400 italic">No actions logged yet today.</p>
        ) : (
          <ul className="space-y-1.5">
            {todayEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-xl bg-cream-100 border border-charcoal-100 px-3 py-2">
                <span className="text-sm text-charcoal-700">{e.description}</span>
                <span className={`font-display font-bold text-sm ${e.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {e.points > 0 ? '+' : ''}{e.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modals */}
      <CustomActionModal
        open={customOpen !== null}
        kind={customOpen}
        onClose={() => setCustomOpen(null)}
        onSubmit={async (pts, desc) => {
          await logEvent(pts, desc, customOpen === 'good' ? 'custom_good' : 'custom_bad');
          setCustomOpen(null);
        }}
      />
      <MakeupModal
        open={makeupOpen}
        onClose={() => setMakeupOpen(false)}
        onSubmit={async (pts, desc) => {
          await logEvent(pts, desc || 'Makeup Points (Parent Discretion)', 'makeup');
          setMakeupOpen(false);
        }}
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        existing={dailyReports.find((r) => r.report_date === today) ?? null}
        onSubmit={async (status, note) => {
          const existing = dailyReports.find((r) => r.report_date === today);
          if (existing) {
            await supabase.from('daily_reports').update({ status, note }).eq('id', existing.id);
          } else {
            await supabase.from('daily_reports').insert({ report_date: today, status, note });
          }
          setReportOpen(false);
          state.refresh();
        }}
      />
    </div>
  );
}

function DailyReportView({ reports, today }: { reports: import('@/lib/types').DailyReport[]; today: string }) {
  const todayReport = reports.find((r) => r.report_date === today);
  const recent = reports.slice(0, 7);
  return (
    <div className="mt-2">
      {todayReport ? (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
          todayReport.status === 'green' ? 'bg-emerald-100 text-emerald-700' :
          todayReport.status === 'yellow' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          Today: {todayReport.status === 'green' ? 'Excellent Day' : todayReport.status === 'yellow' ? 'Minor Infractions' : 'Strikes Triggered'}
        </div>
      ) : (
        <p className="text-xs text-charcoal-400">Not yet closed out today.</p>
      )}
      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recent.map((r) => (
            <div key={r.id} className="flex items-center gap-1 text-xs">
              <span className={`h-3 w-3 rounded-full ${
                r.status === 'green' ? 'bg-emerald-500' : r.status === 'yellow' ? 'bg-amber-400' : 'bg-red-500'
              }`} />
              <span className="text-charcoal-500">{prettyDate(r.report_date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomActionModal({
  open, kind, onClose, onSubmit,
}: {
  open: boolean;
  kind: 'good' | 'bad' | null;
  onClose: () => void;
  onSubmit: (points: number, desc: string) => Promise<void>;
}) {
  const [pts, setPts] = useState(1);
  const [desc, setDesc] = useState('');
  if (!open) return null;
  const isGood = kind === 'good';
  return (
    <Modal open={open} onClose={onClose} title={isGood ? 'Miscellaneous Good Action' : 'Miscellaneous Bad Behavior'}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase text-charcoal-500">Points</label>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setPts((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-xl bg-charcoal-100 grid place-items-center font-bold">−</button>
            <input
              type="number"
              value={pts}
              onChange={(e) => setPts(Math.max(1, Number(e.target.value) || 1))}
              className="flex-1 text-center font-display font-bold text-xl rounded-xl border border-charcoal-200 py-2"
            />
            <button onClick={() => setPts((p) => p + 1)} className="h-9 w-9 rounded-xl bg-charcoal-100 grid place-items-center font-bold">+</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-charcoal-500">Description</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={isGood ? 'What did Aniyah do?' : 'What happened?'}
            className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => onSubmit(isGood ? Math.abs(pts) : -Math.abs(pts), desc || (isGood ? 'Good action' : 'Bad behavior'))}
          className={`w-full py-3 rounded-2xl font-bold text-white ${isGood ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isGood ? 'Award' : 'Apply'} {isGood ? '+' : '−'}{pts} points
        </button>
      </div>
    </Modal>
  );
}

function MakeupModal({
  open, onClose, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (points: number, desc: string) => Promise<void>;
}) {
  const [pts, setPts] = useState(2);
  const [desc, setDesc] = useState('');
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Grant Makeup Points">
      <div className="space-y-3">
        <div className="text-sm text-charcoal-600">Award positive makeup points to Aniyah at your discretion.</div>
        <div>
          <label className="text-xs font-bold uppercase text-charcoal-500">Points</label>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setPts((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-xl bg-charcoal-100 grid place-items-center font-bold">−</button>
            <input
              type="number"
              value={pts}
              onChange={(e) => setPts(Math.max(1, Number(e.target.value) || 1))}
              className="flex-1 text-center font-display font-bold text-xl rounded-xl border border-charcoal-200 py-2"
            />
            <button onClick={() => setPts((p) => p + 1)} className="h-9 w-9 rounded-xl bg-charcoal-100 grid place-items-center font-bold">+</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-charcoal-500">Reason (optional)</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Exceptional effort, attitude shift..."
            className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => onSubmit(Math.abs(pts), desc)}
          className="w-full py-3 rounded-2xl font-bold text-white bg-ginger-500 hover:bg-ginger-600"
        >
          Grant +{pts} Makeup Points
        </button>
      </div>
    </Modal>
  );
}

function ReportModal({
  open, onClose, existing, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  existing: import('@/lib/types').DailyReport | null;
  onSubmit: (status: 'green' | 'yellow' | 'red', note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>(existing?.status ?? 'green');
  const [note, setNote] = useState(existing?.note ?? '');
  if (!open) return null;
  const options: { key: 'green' | 'yellow' | 'red'; label: string; desc: string }[] = [
    { key: 'green', label: 'Excellent Day', desc: 'Green' },
    { key: 'yellow', label: 'Warning / Minor', desc: 'Yellow' },
    { key: 'red', label: 'Strikes Triggered', desc: 'Red' },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Close Out the Day">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setStatus(o.key)}
              className={`rounded-2xl p-3 border-2 text-center transition-colors ${
                status === o.key
                  ? o.key === 'green' ? 'bg-emerald-50 border-emerald-500' : o.key === 'yellow' ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500'
                  : 'bg-cream-50 border-charcoal-200'
              }`}
            >
              <div className={`h-8 w-8 rounded-full mx-auto mb-1 ${
                o.key === 'green' ? 'bg-emerald-500' : o.key === 'yellow' ? 'bg-amber-400' : 'bg-red-500'
              }`} />
              <div className="text-xs font-bold text-charcoal-700">{o.label}</div>
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-charcoal-500">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-charcoal-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => onSubmit(status, note)}
          className="w-full py-3 rounded-2xl font-bold text-white bg-charcoal-700 hover:bg-charcoal-800"
        >
          Save Daily Report
        </button>
      </div>
    </Modal>
  );
}
