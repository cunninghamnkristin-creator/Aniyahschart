import { useEffect, useMemo, useState } from 'react';
import { Shield, Cat, Settings as SettingsIcon, X, Zap, ListChecks, BookOpen, Users } from 'lucide-react';
import { useAppState, dailyPoints, totalStars, completedTaskIds } from '@/lib/useAppState';
import { todayISO } from '@/lib/dates';
import { BalancesWidget } from '@/components/BalancesWidget';
import { BehaviorTab } from '@/components/BehaviorTab';
import { HomeschoolTab } from '@/components/HomeschoolTab';
import { RoutineTab } from '@/components/RoutineTab';
import { FamilyHubTab } from '@/components/FamilyHubTab';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Modal } from '@/components/Modal';
import { playClick } from '@/lib/audio';

type Mode = 'parent' | 'aniyah';
type Tab = 'behavior' | 'homeschool' | 'routine' | 'family';

export default function App() {
  const state = useAppState();
  const [mode, setMode] = useState<Mode>('aniyah');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<Tab>('behavior');
  const [showSettings, setShowSettings] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const isParent = mode === 'parent';

  // Derived balances
  const points = useMemo(() => dailyPoints(state.behaviorEvents), [state.behaviorEvents]);
  const stars = useMemo(() => totalStars(state.homeschoolCompletions), [state.homeschoolCompletions]);
  const completedToday = useMemo(() => completedTaskIds(state.taskCompletions), [state.taskCompletions]);

  // Active strikes derived from settings + daily score
  const activeStrikes = useMemo(() => {
    const cfg = state.settings?.strike_config ?? [];
    return cfg.filter((s) => points <= s.threshold);
  }, [state.settings, points]);

  // Strike alert: when a strike becomes active, show the banner
  useEffect(() => {
    if (activeStrikes.length > 0) {
      const top = activeStrikes[activeStrikes.length - 1];
      setAlert(`Warning: ${top.label} Active`);
    }
  }, [activeStrikes.length]);

  function requestSwitchToParent() {
    if (mode === 'parent') {
      setMode('aniyah');
      setShowSettings(false);
      playClick();
      return;
    }
    setPinInput('');
    setPinError(false);
    setPinOpen(true);
  }

  function submitPin() {
    if (pinInput === (state.settings?.pin ?? '1234')) {
      setMode('parent');
      setPinOpen(false);
      setPinInput('');
      setPinError(false);
      playClick();
    } else {
      setPinError(true);
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <Cat size={48} className="mx-auto text-ginger-400 animate-wiggle" />
          <p className="mt-3 font-display font-bold text-charcoal-600">Loading Aniyah's tracker...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-display font-bold text-red-600">Something went wrong loading the tracker.</p>
          <p className="text-sm text-charcoal-500 mt-2">{state.error}</p>
          <button onClick={() => state.refresh()} className="mt-4 px-4 py-2 rounded-xl bg-ginger-500 text-white font-bold text-sm">Try again</button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Zap }[] = [
    { key: 'behavior', label: 'Behavior', icon: Zap },
    { key: 'homeschool', label: 'Homeschool', icon: BookOpen },
    { key: 'routine', label: 'Routines', icon: ListChecks },
    { key: 'family', label: 'Family Hub', icon: Users },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Profile header */}
      <header className="bg-cream-100 border-b border-charcoal-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Cat avatar */}
          <div className="relative shrink-0">
            <img
              src={isParent
                ? "https://images.pexels.com/photos/617278/pexels-photo-617278.jpeg?auto=compress&cs=tinysrgb&w=200"
                : "https://images.pexels.com/photos/156934/pexels-photo-156934.jpeg?auto=compress&cs=tinysrgb&w=200"
              }
              alt={isParent ? "Gray and white cat" : "Orange tabby cat"}
              className="h-12 w-12 rounded-full object-cover border-2 border-ginger-300"
            />
            <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-cream-100 ${isParent ? 'bg-charcoal-500' : 'bg-ginger-500'}`} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-charcoal-900 leading-tight truncate">
              {isParent ? "Parent Dashboard" : "Aniyah Franklin"}
            </h1>
            <p className="text-xs text-charcoal-500">{isParent ? "Parent Control Mode" : "Aniyah Mode"}</p>
          </div>

          {/* Settings gear (parent only) */}
          {isParent && (
            <button
              onClick={() => { setShowSettings((s) => !s); playClick(); }}
              className={`ml-auto grid place-items-center h-10 w-10 rounded-xl border-2 ${showSettings ? 'bg-ginger-500 border-ginger-500 text-white' : 'bg-cream-50 border-charcoal-200 text-charcoal-600'}`}
              aria-label="Settings"
            >
              <SettingsIcon size={20} />
            </button>
          )}

          {/* Mode toggle */}
          <button
            onClick={requestSwitchToParent}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 ${
              isParent
                ? 'bg-charcoal-700 border-charcoal-700 text-white'
                : 'bg-cream-50 border-charcoal-200 text-charcoal-600'
            }`}
          >
            <Shield size={16} />
            {isParent ? 'Parent' : 'Aniyah'}
          </button>
        </div>
      </header>

      {/* Permanent balances widget */}
      <BalancesWidget
        stars={stars}
        starGoal={state.settings?.star_goal ?? 30}
        dailyPoints={points}
        activeStrikes={activeStrikes.length}
        settings={state.settings!}
      />

      {/* Flashing strike alert — visible across all tabs */}
      {alert && !showSettings && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="rounded-2xl border-2 border-red-400 bg-red-500 text-white p-3 animate-flashBanner flex items-center gap-2">
            <Zap size={20} className="shrink-0 animate-wiggle" fill="currentColor" strokeWidth={0} />
            <span className="font-display font-bold flex-1">Warning: {alert.replace('Warning: ', '')}</span>
            {isParent && (
              <button onClick={() => setAlert(null)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {showSettings && isParent ? (
          <SettingsPanel state={state} />
        ) : (
          <>
            {tab === 'behavior' && (
              <BehaviorTab
                state={state}
                isParent={isParent}
                onPointsChanged={(_was, isNeg) => {
                  if (isNeg) {
                    const top = activeStrikes[activeStrikes.length - 1];
                    if (top) setAlert(`Warning: ${top.label} Active`);
                  }
                }}
              />
            )}
            {tab === 'homeschool' && <HomeschoolTab state={state} isParent={isParent} />}
            {tab === 'routine' && <RoutineTab state={state} isParent={isParent} />}
            {tab === 'family' && (
              <FamilyHubTab
                state={state}
                isParent={isParent}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom tab navigation */}
      {!showSettings && (
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-cream-50/95 backdrop-blur border-t border-charcoal-200">
          <div className="max-w-3xl mx-auto grid grid-cols-4">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); playClick(); }}
                  className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                    active ? 'text-ginger-600' : 'text-charcoal-400'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{t.label}</span>
                  {active && <span className="h-1 w-6 rounded-full bg-ginger-500 -mt-0.5" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* PIN modal */}
      <Modal open={pinOpen} onClose={() => setPinOpen(false)} title="Enter Parent PIN">
        <div className="space-y-3">
          <p className="text-sm text-charcoal-600">Enter the 4-digit PIN to switch to Parent Control Mode.</p>
          <input
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && submitPin()}
            inputMode="numeric"
            autoFocus
            placeholder="••••"
            className={`w-full text-center font-display font-bold text-3xl tracking-[0.5em] rounded-xl border-2 py-3 ${
              pinError ? 'border-red-400 bg-red-50' : 'border-charcoal-200 bg-cream-100'
            }`}
          />
          {pinError && <p className="text-sm font-semibold text-red-600 text-center">Incorrect PIN. Try again.</p>}
          <button onClick={submitPin} className="w-full py-3 rounded-2xl font-bold text-white bg-ginger-500 hover:bg-ginger-600">
            Unlock
          </button>
          <p className="text-xs text-center text-charcoal-400">Default PIN is 1234 — change it in Settings.</p>
        </div>
      </Modal>
    </div>
  );
}
