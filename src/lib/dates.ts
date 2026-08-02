// Date helpers — all calculations in local time.

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWeekend(d: Date = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isSaturday(d: Date = new Date()): boolean {
  return d.getDay() === 6;
}

export function dayName(d: Date = new Date()): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

// Wake-up target: 9:30 AM Mon–Fri, 10:30 AM Sat–Sun
export function wakeUpTarget(d: Date = new Date()): string {
  return isWeekend(d) ? '10:30 AM' : '9:30 AM';
}

// Bedtime windows: weekdays 9:00 PM bed / 9:30 PM electronics; weekends 12:00 AM / 12:30 AM
export function bedtimeWindows(d: Date = new Date()): { bed: string; electronics: string } {
  if (isWeekend(d)) {
    return { bed: '12:00 AM', electronics: '12:30 AM' };
  }
  return { bed: '9:00 PM', electronics: '9:30 PM' };
}

// ISO week key (e.g. "2026-W31") for weekly reward tracking
export function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
