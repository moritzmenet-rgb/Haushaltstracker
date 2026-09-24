export type UserRole = 'admin' | 'member';

export type ColorTheme = 'indigo' | 'emerald' | 'rose' | 'amber';

export interface FamilyMember {
  id: string;
  name: string;
  role: UserRole;
  avatar_color: string;
  total_points: number;
  weekly_target: number;
  pin_code?: string;
  has_seen_tutorial?: boolean;
  preferred_theme?: ColorTheme;
  preferred_mode?: 'light' | 'dark';
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  base_points: number;
  estimated_duration: number; // in minutes
  interval_days: number;
  frequency_per_day?: number; // how many times per day
  preferred_time?: 'morning' | 'noon' | 'evening' | null;
  created_by: string;
  last_done: string | null; // ISO string
  fished_by?: string | null; // member ID
  fished_until?: string | null; // ISO string
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
  star_multiplier_1?: number; // e.g. 50 (%)
  star_multiplier_2?: number; // e.g. 75 (%)
  star_multiplier_3?: number; // e.g. 100 (%)
  rollover_min_target?: number; // Minimum weekly target (e.g. 10)
  rollover_max_target?: number; // Maximum weekly target (e.g. 150)
  rollover_factor?: number; // Percentage of difference to roll over (e.g. 100%)
  rollover_surplus_factor?: number; // Surplus roll-over factor in % (e.g. 100%)
  rollover_deficit_factor?: number; // Deficit roll-over factor in % (e.g. 100%)
  week_start_day?: 'monday' | 'sunday' | 'saturday';
  allowed_emails?: string[];
}

export interface SessionLog {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  timestamp: string;
  is_blocked?: boolean;
}

export type PostItColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[]; // member IDs who voted for this option
}

export interface PinnwandPoll {
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
  closed?: boolean;
  closedBy?: string;
}

export interface PinnwandNote {
  id: string;
  rootId: string; // The root topic id (equals id if it's the root post-it)
  parentId: string | null; // null if root, or parent note id
  depth: number; // 0 for root topic, 1 for comment, 2 for reply to comment, etc.
  title?: string; // primarily for root postit
  content: string;
  color: PostItColor;
  category?: string;
  authorId: string;
  authorName: string;
  authorAvatarColor: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
  isPinned?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of memberIds
  poll?: PinnwandPoll;
  position?: { x: number; y: number }; // canvas position in pixels
  rotation?: number; // subtle angle in deg (-3 to 3)
}

export interface FamilyData {
  settings: FamilySettings;
  members: Record<string, FamilyMember>;
  tasks: Record<string, TaskItem>;
  logs: ChoreLog[];
  pinnwand?: Record<string, PinnwandNote>;
}

export interface WeeklyRollOverPreview {
  memberId: string;
  memberName: string;
  oldTarget: number;
  achievedPoints: number;
  difference: number; // oldTarget - achievedPoints (positive = deficit, negative = surplus)
  newTarget: number;
}
