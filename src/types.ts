export type UserRole = 'admin' | 'member';

export type ColorTheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'bayern';

export interface FamilyMember {
  id: string;
  name: string;
  role: UserRole;
  avatar_color: string;
  total_points: number;
  weekly_target: number;
  pin_code?: string;
  has_seen_tutorial?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  base_points: number;
  estimated_duration: number; // in minutes
  interval_days: number;
  created_by: string;
  last_done: string | null; // ISO string
}

export interface ChoreLog {
  log_id: string;
  task_id: string;
  user_id: string;
  stars: 1 | 2 | 3;
  points_awarded: number;
  actual_duration: number; // in minutes
  timestamp: string; // ISO string
  notes?: string;
}

export interface FamilySettings {
  household_name?: string;
  default_weekly_target: number;
  categories: string[];
  firebase_url?: string;
  last_reset_date?: string;
  color_theme?: ColorTheme;
  bayern_matchday_enabled?: boolean; // When true, automatically switches to FC Bayern theme on matchdays (default: true)
  bayern_matchday_force?: boolean; // When true, forces the FC Bayern theme on for preview/testing
  star_multiplier_1?: number; // e.g. 50 (%)
  star_multiplier_2?: number; // e.g. 75 (%)
  star_multiplier_3?: number; // e.g. 100 (%)
  rollover_min_target?: number; // Minimum weekly target (e.g. 10)
  rollover_max_target?: number; // Maximum weekly target (e.g. 150)
  rollover_factor?: number; // Percentage of difference to roll over (e.g. 100%)
  rollover_surplus_factor?: number; // Surplus roll-over factor in % (e.g. 100%)
  rollover_deficit_factor?: number; // Deficit roll-over factor in % (e.g. 100%)
  week_start_day?: 'monday' | 'sunday' | 'saturday';
}

export interface FamilyData {
  settings: FamilySettings;
  members: Record<string, FamilyMember>;
  tasks: Record<string, TaskItem>;
  logs: ChoreLog[];
}

export interface WeeklyRollOverPreview {
  memberId: string;
  memberName: string;
  oldTarget: number;
  achievedPoints: number;
  difference: number; // oldTarget - achievedPoints (positive = deficit, negative = surplus)
  newTarget: number;
}
