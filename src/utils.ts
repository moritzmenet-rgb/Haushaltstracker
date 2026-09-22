import { ChoreLog, FamilyMember, TaskItem } from './types';

/**
 * Design System Category Tag Styles:
 * - Bad: Light Blue Pill (bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300)
 * - Küche: Warm Amber Pill (bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300)
 * - Garten: Fresh Emerald Pill (bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300)
 * - Zimmer: Soft Purple Pill (bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300)
 * - Allgemein: Neutral Slate Pill (bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300)
 */
export function getCategoryStyle(category: string): string {
  switch (category?.toLowerCase()) {
    case 'bad':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40';
    case 'küche':
    case 'kueche':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40';
    case 'garten':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40';
    case 'zimmer':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/40';
    case 'allgemein':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60';
  }
}

/**
 * Design System Netflix-Style Profile Avatar Colors:
 * - Moritz (Admin): #4F46E5 (Indigo)
 * - Profile 2: #10B981 (Emerald)
 * - Profile 3: #F59E0B (Amber)
 * - Profile 4: #EC4899 (Pink)
 * - Profile 5: #06B6D4 (Cyan)
 */
export const PROFILE_AVATAR_PALETTE = [
  '#4F46E5', // Moritz (Admin) - Indigo
  '#10B981', // Profile 2 - Emerald
  '#F59E0B', // Profile 3 - Amber
  '#EC4899', // Profile 4 - Pink
  '#06B6D4'  // Profile 5 - Cyan
];

/**
 * Rating Factor according to business logic:
 * 1 Star = 0.50 | 2 Stars = 0.75 | 3 Stars = 1.00
 */
export const RATING_FACTORS: Record<1 | 2 | 3, number> = {
  1: 0.50,
  2: 0.75,
  3: 1.00
};

export function calculatePoints(
  basePoints: number, 
  stars: 1 | 2 | 3,
  settings?: { star_multiplier_1?: number; star_multiplier_2?: number; star_multiplier_3?: number }
): number {
  let factor = RATING_FACTORS[stars] || 1;
  if (settings) {
    if (stars === 1 && typeof settings.star_multiplier_1 === 'number') {
      factor = settings.star_multiplier_1 / 100;
    } else if (stars === 2 && typeof settings.star_multiplier_2 === 'number') {
      factor = settings.star_multiplier_2 / 100;
    } else if (stars === 3 && typeof settings.star_multiplier_3 === 'number') {
      factor = settings.star_multiplier_3 / 100;
    }
  }
  const result = Math.round(basePoints * factor);
  return basePoints > 0 ? Math.max(1, result) : 0;
}

/**
 * Calculates dynamic target roll-over:
 * New Target = Base Target + (Old Target - Achieved Points) * Factor
 * Clamped between minTarget and maxTarget
 */
export function calculateRollOverTarget(
  baseDefaultTarget: number, 
  oldTarget: number, 
  achievedPoints: number,
  rules?: { minTarget?: number; maxTarget?: number; factor?: number }
): number {
  const diffFactor = (rules?.factor !== undefined ? rules.factor : 100) / 100;
  const difference = (oldTarget - achievedPoints) * diffFactor;
  const newTarget = Math.round(baseDefaultTarget + difference);
  const min = rules?.minTarget ?? 10;
  const max = rules?.maxTarget ?? 200;
  return Math.min(max, Math.max(min, newTarget));
}

export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return 'Noch nie';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return 'Gerade eben';
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wo.`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getTaskDueStatus(task: TaskItem): { status: 'overdue' | 'due-soon' | 'ok'; text: string; daysOverdue: number } {
  if (!task.last_done) {
    return { status: 'overdue', text: 'Noch nie erledigt', daysOverdue: 999 };
  }
  const lastDate = new Date(task.last_done).getTime();
  const nextDue = lastDate + (task.interval_days * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const diffDays = Math.floor((now - nextDue) / (24 * 60 * 60 * 1000));

  if (diffDays > 0) {
    return {
      status: 'overdue',
      text: diffDays === 1 ? 'Seit 1 Tag fällig' : `Seit ${diffDays} Tagen fällig`,
      daysOverdue: diffDays
    };
  } else if (diffDays === 0 || diffDays === -1) {
    return { status: 'due-soon', text: 'Bald fällig', daysOverdue: 0 };
  } else {
    const daysLeft = Math.abs(diffDays);
    return { status: 'ok', text: `Fällig in ${daysLeft} Tagen`, daysOverdue: 0 };
  }
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Filters chore logs belonging to the current cycle/week
 */
export function getCycleLogs(logs: ChoreLog[], cycleStartDate?: string): ChoreLog[] {
  let startTimestamp = 0;
  if (cycleStartDate) {
    startTimestamp = new Date(cycleStartDate).getTime();
  } else {
    // Default to last 7 days
    startTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
  }
  return logs.filter(l => new Date(l.timestamp).getTime() >= startTimestamp);
}

export function getMemberCyclePoints(memberId: string, logs: ChoreLog[], cycleStartDate?: string): number {
  const cycleLogs = getCycleLogs(logs, cycleStartDate);
  return cycleLogs
    .filter(l => l.user_id === memberId)
    .reduce((sum, l) => sum + (l.points_awarded || 0), 0);
}
