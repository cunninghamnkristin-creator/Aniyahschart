import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { todayISO } from './dates';
import type {
  BehaviorButton,
  BehaviorEvent,
  DailyReport,
  HomeschoolCompletion,
  HomeschoolTask,
  Message,
  NeedsItem,
  RoutineTask,
  Settings,
  TaskCompletion,
} from './types';

export interface AppState {
  settings: Settings | null;
  behaviorButtons: BehaviorButton[];
  behaviorEvents: BehaviorEvent[];
  dailyReports: DailyReport[];
  routineTasks: RoutineTask[];
  taskCompletions: TaskCompletion[];
  homeschoolTasks: HomeschoolTask[];
  homeschoolCompletions: HomeschoolCompletion[];
  messages: Message[];
  needsList: NeedsItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAppState(): AppState {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [behaviorButtons, setBehaviorButtons] = useState<BehaviorButton[]>([]);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [homeschoolTasks, setHomeschoolTasks] = useState<HomeschoolTask[]>([]);
  const [homeschoolCompletions, setHomeschoolCompletions] = useState<HomeschoolCompletion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [needsList, setNeedsList] = useState<NeedsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [
      s, bb, be, dr, rt, tc, hst, hsc, msg, nl,
    ] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('behavior_buttons').select('*').order('sort_order'),
      supabase.from('behavior_events').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_reports').select('*').order('report_date', { ascending: false }),
      supabase.from('routine_tasks').select('*').order('sort_order'),
      supabase.from('task_completions').select('*'),
      supabase.from('homeschool_tasks').select('*').order('sort_order'),
      supabase.from('homeschool_completions').select('*').order('completion_date', { ascending: false }),
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('needs_list').select('*').order('created_at', { ascending: false }),
    ]);

    const anyError = [s, bb, be, dr, rt, tc, hst, hsc, msg, nl].find((r) => r.error);
    if (anyError?.error) {
      setError(anyError.error.message);
    } else {
      setSettings(s.data as Settings);
      setBehaviorButtons(bb.data as BehaviorButton[]);
      setBehaviorEvents(be.data as BehaviorEvent[]);
      setDailyReports(dr.data as DailyReport[]);
      setRoutineTasks(rt.data as RoutineTask[]);
      setTaskCompletions(tc.data as TaskCompletion[]);
      setHomeschoolTasks(hst.data as HomeschoolTask[]);
      setHomeschoolCompletions(hsc.data as HomeschoolCompletion[]);
      setMessages(msg.data as Message[]);
      setNeedsList(nl.data as NeedsItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    settings,
    behaviorButtons,
    behaviorEvents,
    dailyReports,
    routineTasks,
    taskCompletions,
    homeschoolTasks,
    homeschoolCompletions,
    messages,
    needsList,
    loading,
    error,
    refresh,
  };
}

// Derived helpers
export function dailyPoints(events: BehaviorEvent[], date: string = todayISO()): number {
  return events
    .filter((e) => e.event_date === date)
    .reduce((sum, e) => sum + e.points, 0);
}

export function totalStars(completions: HomeschoolCompletion[]): number {
  return completions.filter((c) => c.star_awarded).length;
}

export function completedTaskIds(completions: TaskCompletion[], date: string = todayISO()): Set<string> {
  return new Set(completions.filter((c) => c.completion_date === date).map((c) => c.task_id));
}
