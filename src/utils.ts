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
  settings?: { star_multiplier_1?: number; star_multiplier_2?: number; star_multiplier_3?: number },
  timestamp?: string
): number {
  let factor = RATING_FACTORS[stars] || 1;
  
  // Cutoff date: September 27, 2026
  const cutoffDate = new Date('2026-09-27T00:00:00Z').getTime();
  const logDate = timestamp ? new Date(timestamp).getTime() : Date.now();
  const isHistorical = logDate < cutoffDate;

  // Only use settings multipliers for entries on or after the cutoff date
  if (settings && !isHistorical) {
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
 * Ermittelt den Timestamp des jüngsten Samstags um 00:00:00 (lokale Zeit).
 * Der Wochenzyklus für Punkte startet am Samstag um 00:00 Uhr und endet am Freitag um 23:59:59.
 */
export function getSaturdayResetTimestamp(nowDate: Date = new Date()): number {
  const d = new Date(nowDate);
  const day = d.getDay(); // 0 = So, 1 = Mo, 2 = Di, 3 = Mi, 4 = Do, 5 = Fr, 6 = Sa
  // Wie viele Tage liegt der jüngste Samstag zurück?
  // Sa (6) -> 0 Tage (heute 00:00 Uhr)
  // So (0) -> 1 Tag
  // Mo (1) -> 2 Tage
  // Di (2) -> 3 Tage
  // Mi (3) -> 4 Tage
  // Do (4) -> 5 Tage
  // Fr (5) -> 6 Tage
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Liefert das Datum des nächsten Samstag-Resets um 00:00 Uhr
 */
export function getNextSaturdayReset(nowDate: Date = new Date()): Date {
  const currentSaturday = new Date(getSaturdayResetTimestamp(nowDate));
  currentSaturday.setDate(currentSaturday.getDate() + 7);
  return currentSaturday;
}

/**
 * Filters chore logs belonging to the current cycle/week (ab jüngstem Samstag 00:00 Uhr)
 */
export function getCycleLogs(logs: ChoreLog[], cycleStartDate?: string): ChoreLog[] {
  const saturdayTimestamp = getSaturdayResetTimestamp();
  let startTimestamp = saturdayTimestamp;

  if (cycleStartDate) {
    const explicit = new Date(cycleStartDate).getTime();
    if (!isNaN(explicit) && explicit > saturdayTimestamp) {
      startTimestamp = explicit;
    }
  }

  return (logs || []).filter(l => new Date(l.timestamp).getTime() >= startTimestamp);
}

/**
 * Berechnet die Wochenpunkte eines Mitglieds (Reset jeden Samstag um 00:00 Uhr)
 */
export function getMemberCyclePoints(memberId: string, logs: ChoreLog[], cycleStartDate?: string): number {
  const cycleLogs = getCycleLogs(logs, cycleStartDate);
  return cycleLogs
    .filter(l => l.user_id === memberId)
    .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
}

/**
 * Berechnet die gesamten Lifetime-Chips eines Mitglieds von Tag 1 an (Total Points, verfallen nie)
 */
export function getMemberChips(memberId: string, logs: ChoreLog[]): number {
  return getMemberTotalPoints(memberId, logs);
}

/**
 * Calculates member total points strictly from all existing chore logs (Total Chips)
 */
export function getMemberTotalPoints(memberId: string, logs: ChoreLog[]): number {
  if (!logs || !Array.isArray(logs)) return 0;
  return logs
    .filter(l => l.user_id === memberId)
    .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
}

export interface WeekHistoryItem {
  id: string;
  weekIndex: number; // 0 = aktuelle Woche, 1 = letzte Woche, 2 = vor 2 Wochen...
  label: string;
  subLabel: string;
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
  totalPoints: number;
  winnerMemberId: string | null;
  winnerPoints: number;
  memberPoints: Record<string, number>;
  taskCount: number;
}

/**
 * Berechnet den historischen Wochenverlauf basierend auf dem Samstags-Reset
 */
export function computeWeeklyHistory(
  logs: ChoreLog[],
  members: Record<string, FamilyMember>,
  weeksCount: number = 8
): WeekHistoryItem[] {
  const history: WeekHistoryItem[] = [];
  const currentSaturdayStart = getSaturdayResetTimestamp();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < weeksCount; i++) {
    const startMs = currentSaturdayStart - (i * ONE_WEEK_MS);
    const endMs = startMs + ONE_WEEK_MS - 1; // Bis Freitag 23:59:59.999
    const startDate = new Date(startMs);
    const endDate = new Date(endMs);

    const weekLogs = (logs || []).filter(l => {
      const t = new Date(l.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });

    const memberPts: Record<string, number> = {};
    Object.keys(members || {}).forEach(mId => {
      memberPts[mId] = 0;
    });

    weekLogs.forEach(l => {
      if (memberPts[l.user_id] !== undefined) {
        memberPts[l.user_id] += Number(l.points_awarded) || 0;
      } else {
        memberPts[l.user_id] = Number(l.points_awarded) || 0;
      }
    });

    const totalPts = weekLogs.reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);

    let winnerId: string | null = null;
    let maxPts = 0;
    Object.entries(memberPts).forEach(([mId, pts]) => {
      if (pts > maxPts) {
        maxPts = pts;
        winnerId = mId;
      }
    });

    const startStr = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.`;
    const endStr = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.`;

    let label = '';
    if (i === 0) {
      label = 'Aktuelle Woche';
    } else if (i === 1) {
      label = 'Letzte Woche';
    } else {
      label = `Vor ${i} Wochen`;
    }

    history.push({
      id: `cycle-week-${i}`,
      weekIndex: i,
      label,
      subLabel: `${startStr} – ${endStr}`,
      startDate,
      endDate,
      isCurrentWeek: i === 0,
      totalPoints: totalPts,
      winnerMemberId: maxPts > 0 ? winnerId : null,
      winnerPoints: maxPts,
      memberPoints: memberPts,
      taskCount: weekLogs.length
    });
  }

  return history;
}
