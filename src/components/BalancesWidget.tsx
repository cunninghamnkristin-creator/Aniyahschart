import { Star, Zap, AlertTriangle } from 'lucide-react';
import type { Settings } from '@/lib/types';

interface Props {
  stars: number;
  starGoal: number;
  dailyPoints: number;
  activeStrikes: number;
  settings: Settings;
}

export function BalancesWidget({ stars, starGoal, dailyPoints, activeStrikes, settings }: Props) {
  const pointsColor =
    dailyPoints > 0
      ? 'text-emerald-600'
      : dailyPoints < 0
      ? 'text-red-600'
      : 'text-charcoal-600';

  return (
    <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur border-b border-charcoal-100 shadow-soft">
      <div className="max-w-3xl mx-auto px-3 py-2.5">
        <div className="grid grid-cols-3 gap-2">
          {/* Stars */}
          <div className="flex items-center gap-2 rounded-2xl bg-ginger-50 border border-ginger-200 px-3 py-2">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-ginger-500 text-white shrink-0">
              <Star size={18} fill="currentColor" strokeWidth={0} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-ginger-700 leading-none">Stars</div>
              <div className="font-display font-bold text-charcoal-900 leading-tight truncate">
                {stars}<span className="text-charcoal-400 font-semibold text-sm">/{starGoal}</span>
              </div>
            </div>
          </div>

          {/* Daily points */}
          <div className="flex items-center gap-2 rounded-2xl bg-charcoal-50 border border-charcoal-200 px-3 py-2">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-charcoal-700 text-white shrink-0">
              <Zap size={18} fill="currentColor" strokeWidth={0} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-charcoal-500 leading-none">Today</div>
              <div className={`font-display font-bold leading-tight truncate ${pointsColor}`}>
                {dailyPoints > 0 ? '+' : ''}{dailyPoints} <span className="text-[10px] font-semibold text-charcoal-400">pts</span>
              </div>
            </div>
          </div>

          {/* Strikes */}
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-3 py-2">
            <div className={`grid place-items-center h-9 w-9 rounded-xl text-white shrink-0 ${activeStrikes > 0 ? 'bg-red-500' : 'bg-charcoal-300'}`}>
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-red-700 leading-none">Strikes</div>
              <div className={`font-display font-bold leading-tight truncate ${activeStrikes > 0 ? 'text-red-600' : 'text-charcoal-500'}`}>
                {activeStrikes} <span className="text-[10px] font-semibold text-charcoal-400">active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
