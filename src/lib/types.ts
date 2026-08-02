export type BehaviorType = 'positive' | 'negative';
export type BehaviorCategory =
  | 'positive'
  | 'negative'
  | 'makeup'
  | 'custom_good'
  | 'custom_bad';

export interface BehaviorButton {
  id: string;
  label: string;
  points: number;
  type: BehaviorType;
  sort_order: number;
  is_preset: boolean;
}

export interface BehaviorEvent {
  id: string;
  event_date: string;
  points: number;
  description: string;
  category: BehaviorCategory;
  created_at: string;
}

export interface DailyReport {
  id: string;
  report_date: string;
  status: 'green' | 'yellow' | 'red';
  note: string | null;
}

export type RoutineCategory =
  | 'morning'
  | 'after_school'
  | 'health'
  | 'cleanup'
  | 'nighttime'
  | 'saturday';

export interface RoutineTask {
  id: string;
  label: string;
  category: RoutineCategory;
  sort_order: number;
  is_active: boolean;
  is_dynamic: boolean;
  expires_on: string | null;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  completion_date: string;
  completed_at: string;
}

export interface HomeschoolTask {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface HomeschoolCompletion {
  id: string;
  completion_date: string;
  star_awarded: boolean;
}

export interface Message {
  id: string;
  author: 'aniyah' | 'parent';
  body: string;
  created_at: string;
}

export interface NeedsItem {
  id: string;
  item: string;
  checked: boolean;
  added_by: string;
  created_at: string;
}

export interface Milestone {
  threshold: number;
  label: string;
  unlocked: boolean;
}

export interface StrikeConfig {
  threshold: number;
  label: string;
  active: boolean;
}

export interface RewardState {
  label: string;
  description: string;
  unlocked: boolean;
}

export interface Settings {
  id: number;
  pin: string;
  star_goal: number;
  reward_milestones: Milestone[];
  strike_config: StrikeConfig[];
  cat_nap_pass: RewardState;
  special_outing: RewardState;
  updated_at: string;
}
