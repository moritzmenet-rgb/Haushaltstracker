import { FamilyData, FamilyMember, ChoreLog, TaskItem } from '../types';
import { ACHIEVEMENTS_DATA, AchievementDef } from '../data/achievementsData';
import { getMemberCyclePoints } from '../utils';

/**
 * Returns the ISO calendar week string (e.g. "2026-W39") for a given Date.
 */
export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export interface ScanAchievementsResult {
  updatedMembers: Record<string, FamilyMember>;
  newlyUnlockedForActiveUser: AchievementDef[];
  trophyOwners: Record<string, string>;
  hasChanges: boolean;
}

/**
 * Calculates live Wanderpokale ownership strictly from current logs and members.
 * Trophies switch owners dynamically in real-time as points/logs are added, updated, or deleted.
 */
export function computeLiveTrophyOwners(
  allLogs: ChoreLog[] = [],
  members: Record<string, FamilyMember> = {},
  currentOwners: Record<string, string> = {}
): Record<string, string> {
  const trophyOwners: Record<string, string> = {};
  const memberList = Object.values(members);

  if (memberList.length === 0 || allLogs.length === 0) {
    return trophyOwners;
  }

  // Pre-calculate per-member metrics
  const taskCounts: Record<string, number> = {};
  const totalPoints: Record<string, number> = {};
  const efficiencyMap: Record<string, number> = {};
  const memberWeekTotals: Record<string, Record<string, number>> = {};

  memberList.forEach(m => {
    taskCounts[m.id] = 0;
    totalPoints[m.id] = 0;
    efficiencyMap[m.id] = 0;
    memberWeekTotals[m.id] = {};
  });

  allLogs.forEach(l => {
    if (!members[l.user_id]) return;
    const uid = l.user_id;
    const pts = Number(l.points_awarded) || 0;
    taskCounts[uid] = (taskCounts[uid] || 0) + 1;
    totalPoints[uid] = (totalPoints[uid] || 0) + pts;

    const weekKey = getISOWeekKey(new Date(l.timestamp));
    if (!memberWeekTotals[uid]) memberWeekTotals[uid] = {};
    memberWeekTotals[uid][weekKey] = (memberWeekTotals[uid][weekKey] || 0) + pts;
  });

  // Calculate efficiency (average points per task)
  memberList.forEach(m => {
    const count = taskCounts[m.id] || 0;
    const pts = totalPoints[m.id] || 0;
    if (count > 0) {
      efficiencyMap[m.id] = pts / count;
    }
  });

  // 1. trophy_king: Most tasks completed
  let maxTasks = 0;
  let kingCandidates: string[] = [];
  memberList.forEach(m => {
    const cnt = taskCounts[m.id] || 0;
    if (cnt > maxTasks) {
      maxTasks = cnt;
      kingCandidates = [m.id];
    } else if (cnt === maxTasks && cnt > 0) {
      kingCandidates.push(m.id);
    }
  });
  if (maxTasks > 0) {
    const curKing = currentOwners['trophy_king'];
    if (curKing && kingCandidates.includes(curKing)) {
      trophyOwners['trophy_king'] = curKing;
    } else {
      trophyOwners['trophy_king'] = kingCandidates[0];
    }
  }

  // 2. trophy_points: Most total points
  let maxPts = 0;
  let pointsCandidates: string[] = [];
  memberList.forEach(m => {
    const pts = totalPoints[m.id] || 0;
    if (pts > maxPts) {
      maxPts = pts;
      pointsCandidates = [m.id];
    } else if (pts === maxPts && pts > 0) {
      pointsCandidates.push(m.id);
    }
  });
  if (maxPts > 0) {
    const curPoints = currentOwners['trophy_points'];
    if (curPoints && pointsCandidates.includes(curPoints)) {
      trophyOwners['trophy_points'] = curPoints;
    } else {
      trophyOwners['trophy_points'] = pointsCandidates[0];
    }
  }

  // 3. trophy_efficiency: Highest average points per task
  const hasMembersWithMultipleTasks = memberList.some(m => (taskCounts[m.id] || 0) >= 2);
  const minTasksRequired = hasMembersWithMultipleTasks ? 2 : 1;

  let maxAvg = 0;
  let efficiencyCandidates: string[] = [];
  memberList.forEach(m => {
    const cnt = taskCounts[m.id] || 0;
    if (cnt >= minTasksRequired) {
      const avg = efficiencyMap[m.id] || 0;
      if (avg > maxAvg) {
        maxAvg = avg;
        efficiencyCandidates = [m.id];
      } else if (avg === maxAvg && avg > 0) {
        efficiencyCandidates.push(m.id);
      }
    }
  });
  if (maxAvg > 0) {
    const curEff = currentOwners['trophy_efficiency'];
    if (curEff && efficiencyCandidates.includes(curEff)) {
      trophyOwners['trophy_efficiency'] = curEff;
    } else {
      trophyOwners['trophy_efficiency'] = efficiencyCandidates[0];
    }
  }

  // 4. trophy_week: Highest points scored in any single week in history
  let maxWeekPts = 0;
  let weekCandidates: string[] = [];
  memberList.forEach(m => {
    const weeks = memberWeekTotals[m.id] || {};
    let memberBestWeek = 0;
    Object.values(weeks).forEach(pts => {
      if (pts > memberBestWeek) memberBestWeek = pts;
    });

    if (memberBestWeek > maxWeekPts) {
      maxWeekPts = memberBestWeek;
      weekCandidates = [m.id];
    } else if (memberBestWeek === maxWeekPts && memberBestWeek > 0) {
      weekCandidates.push(m.id);
    }
  });
  if (maxWeekPts > 0) {
    const curWeek = currentOwners['trophy_week'];
    if (curWeek && weekCandidates.includes(curWeek)) {
      trophyOwners['trophy_week'] = curWeek;
    } else {
      trophyOwners['trophy_week'] = weekCandidates[0];
    }
  }

  return trophyOwners;
}

/**
 * Evaluates the full history of logs, settings, and profile state from day one
 * for all family members. Ensures all achievements and 4 trophies
 * trigger accurately according to their full historical records.
 */
export function scanAndAwardHistoricalAchievements(
  data: FamilyData,
  activeUserId?: string | null,
  easterEggClicks: number = 0
): ScanAchievementsResult {
  const nowISO = new Date().toISOString();
  const allLogs = data.logs || [];
  const allTasks = data.tasks || {};
  const currentMembers = data.members || {};
  const settings = data.settings;

  let hasChanges = false;
  const updatedMembers: Record<string, FamilyMember> = { ...currentMembers };
  const newlyUnlockedForActiveUser: AchievementDef[] = [];

  // Map of all achievements by ID for quick lookup
  const achievementMap = new Map<string, AchievementDef>();
  ACHIEVEMENTS_DATA.forEach(a => achievementMap.set(a.id, a));

  // --- 1. Evaluate Every Member from Day 1 ---
  Object.values(currentMembers).forEach((member) => {
    const memberLogs = allLogs.filter(l => l.user_id === member.id);
    const existingUnlocked: Record<string, string> = { ...(member.unlocked_badges || {}) };
    let memberModified = false;

    // Helper to award a badge if not already present
    const awardBadge = (badgeId: string, timestamp?: string) => {
      if (!existingUnlocked[badgeId]) {
        existingUnlocked[badgeId] = timestamp || nowISO;
        memberModified = true;

        if (activeUserId === member.id) {
          const def = achievementMap.get(badgeId);
          if (def && !newlyUnlockedForActiveUser.some(b => b.id === def.id)) {
            newlyUnlockedForActiveUser.push(def);
          }
        }
      }
    };

    // --- Task Count Milestones ---
    const totalTasks = memberLogs.length;
    if (totalTasks >= 1) awardBadge('tasks_1');
    if (totalTasks >= 25) awardBadge('tasks_25');
    if (totalTasks >= 66) awardBadge('secret_devil');
    if (totalTasks >= 100) awardBadge('tasks_100');
    if (totalTasks >= 250) awardBadge('tasks_250');
    if (totalTasks >= 500) awardBadge('tasks_500');

    // --- Stars & Quality ---
    const has3Stars = memberLogs.some(l => l.stars === 3);
    if (has3Stars) awardBadge('stars_first_3');

    // Notes & Justifications
    const notesCount = memberLogs.filter(l => Boolean(l.notes && l.notes.trim().length >= 4)).length;
    const star2or3NotesCount = memberLogs.filter(l => l.stars >= 2 && Boolean(l.notes && l.notes.trim().length >= 4)).length;
    if (star2or3NotesCount >= 10) awardBadge('notes_10');
    if (notesCount >= 10) awardBadge('open_book');

    // --- Category Milestones ---
    let kitchenCount = 0;
    let badCount = 0;
    let stubeCount = 0;
    let roomCount = 0;
    let gartenCount = 0;
    let gangCount = 0;

    memberLogs.forEach(log => {
      const task = allTasks[log.task_id];
      const cat = (task?.category || '').toLowerCase();
      const title = (task?.title || '').toLowerCase();

      if (cat.includes('küch') || cat.includes('kuch') || title.includes('küch') || title.includes('geschirr') || title.includes('abwasch') || title.includes('kochen') || title.includes('backen')) {
        kitchenCount++;
      }
      if (cat.includes('bad') || cat.includes('wc') || cat.includes('sanit') || cat.includes('toilet') || title.includes('bad') || title.includes('wc') || title.includes('dusche')) {
        badCount++;
      }
      if (cat.includes('stube') || cat.includes('wohn') || cat.includes('sofa') || title.includes('stube') || title.includes('wohnzimmer') || title.includes('couch')) {
        stubeCount++;
      }
      if (cat.includes('zimmer') || cat.includes('schlaf') || cat.includes('kinder') || title.includes('zimmer') || title.includes('bett') || title.includes('aufräumen')) {
        roomCount++;
      }
      if (cat.includes('garten') || cat.includes('balkon') || cat.includes('pflanz') || title.includes('garten') || title.includes('balkon') || title.includes('rasen') || title.includes('blumen')) {
        gartenCount++;
      }
      if (cat.includes('gang') || cat.includes('gänge') || cat.includes('flur') || cat.includes('trepp') || title.includes('flur') || title.includes('gang') || title.includes('treppe') || title.includes('eingang')) {
        gangCount++;
      }
    });

    if (kitchenCount >= 20) awardBadge('cat_kitchen_20');
    if (badCount >= 15) awardBadge('cat_bad_15');
    if (stubeCount >= 15) awardBadge('cat_stube_15');
    if (roomCount >= 15) awardBadge('cat_room_15');
    if (gartenCount >= 15) awardBadge('cat_garten_15');
    if (gangCount >= 15) awardBadge('cat_gänge_15');

    // --- Time-of-Day Milestones ---
    let hasNightLog = false;
    let hasEarlyBirdLog = false;

    memberLogs.forEach(l => {
      const dt = new Date(l.timestamp);
      const h = dt.getHours();
      if (h >= 1 && h <= 4) hasNightLog = true;
      if (h >= 5 && h < 7) hasEarlyBirdLog = true;
    });

    if (hasNightLog) awardBadge('secret_night');
    if (hasEarlyBirdLog) awardBadge('early_bird');

    // --- Profile Title Milestone ---
    if (member.active_badge_id) {
      awardBadge('badge_title');
    }

    // --- Secret: Multitasker (>= 3 distinct categories on a single day) ---
    const dayCategoryMap: Record<string, Set<string>> = {};
    memberLogs.forEach(l => {
      const dayKey = new Date(l.timestamp).toDateString();
      const task = allTasks[l.task_id];
      const category = (task?.category || 'Allgemein').toLowerCase().trim();
      if (!dayCategoryMap[dayKey]) dayCategoryMap[dayKey] = new Set();
      dayCategoryMap[dayKey].add(category);
    });
    const hasMultitaskerDay = Object.values(dayCategoryMap).some(catSet => catSet.size >= 3);
    if (hasMultitaskerDay) awardBadge('secret_multitasker');

    // --- Secret: Wordsmith (detailed notes with >= 40 chars) ---
    const hasWordsmithNote = memberLogs.some(l => l.notes && l.notes.trim().length >= 40);
    if (hasWordsmithNote) awardBadge('secret_wordsmith');

    // --- Easter Egg Secret ---
    if (easterEggClicks >= 10 && activeUserId === member.id) {
      awardBadge('secret_easter_egg');
    }

    // --- Weekly Analysis (Historical Weeks from Day 1) ---
    // Group logs by ISO calendar week
    const weekMap: Record<string, ChoreLog[]> = {};
    memberLogs.forEach(log => {
      const weekKey = getISOWeekKey(new Date(log.timestamp));
      if (!weekMap[weekKey]) weekMap[weekKey] = [];
      weekMap[weekKey].push(log);
    });

    const targetPoints = member.weekly_target || settings.default_weekly_target || 30;
    let weeksWithGoalAchieved = 0;
    let hasExact30 = false;
    let hasOver50 = false;
    let has5StarsInAnyWeek = false;
    let hasAntsWeek = false;
    let hasSpeedMonday = false;
    let hasSundayLastMinute = false;
    let hasStreak3Days = false;

    Object.entries(weekMap).forEach(([_, weekLogs]) => {
      const weekPoints = weekLogs.reduce((sum, l) => sum + (l.points_awarded || 0), 0);
      const star3Count = weekLogs.filter(l => l.stars === 3).length;
      const all1Stars = weekLogs.length > 0 && weekLogs.every(l => l.stars === 1);

      // Distinct days in that week
      const distinctDays = new Set(weekLogs.map(l => new Date(l.timestamp).toDateString())).size;
      if (distinctDays >= 3) hasStreak3Days = true;

      if (star3Count >= 5) has5StarsInAnyWeek = true;

      if (weekPoints >= targetPoints || weekPoints >= 30) {
        weeksWithGoalAchieved++;

        if (all1Stars) hasAntsWeek = true;

        // Check if achieved on day 1 (Saturday or Monday)
        const firstDayLogs = weekLogs.filter(l => {
          const day = new Date(l.timestamp).getDay();
          return day === 6 || day === 1;
        });
        const firstDayPoints = firstDayLogs.reduce((s, l) => s + (l.points_awarded || 0), 0);
        if (firstDayPoints >= targetPoints || firstDayPoints >= 30) {
          hasSpeedMonday = true;
        }

        // Check if finished on Friday before Saturday reset (after 18:00) or Sunday late
        const hasLastMinuteLate = weekLogs.some(l => {
          const d = new Date(l.timestamp);
          const day = d.getDay();
          const hr = d.getHours();
          return (day === 5 && hr >= 18) || (day === 0 && hr >= 20);
        });
        if (hasLastMinuteLate) hasSundayLastMinute = true;
      }

      if (Math.abs(weekPoints - 30) < 0.15) hasExact30 = true;
      if (weekPoints > 50) hasOver50 = true;
    });

    // Also factor in current weekly cycle points
    const currentCyclePoints = getMemberCyclePoints(member.id, allLogs, settings.last_reset_date);
    if (currentCyclePoints >= targetPoints || currentCyclePoints >= 30) {
      if (weeksWithGoalAchieved === 0) weeksWithGoalAchieved = 1;
    }
    if (Math.abs(currentCyclePoints - 30) < 0.15) hasExact30 = true;
    if (currentCyclePoints > 50) hasOver50 = true;

    // Award Weekly Milestones
    if (weeksWithGoalAchieved >= 1) awardBadge('milestone_goal_1');
    if (weeksWithGoalAchieved >= 5) awardBadge('milestone_goal_5');
    if (weeksWithGoalAchieved >= 10) awardBadge('milestone_goal_10');
    if (weeksWithGoalAchieved >= 25) awardBadge('milestone_goal_25');

    if (hasExact30) awardBadge('exact_30');
    if (hasOver50) awardBadge('over_50');
    if (has5StarsInAnyWeek) awardBadge('stars_5_per_week');
    if (hasStreak3Days) awardBadge('streak_3_days');
    if (hasAntsWeek) awardBadge('secret_ants');
    if (hasSpeedMonday) awardBadge('secret_speed');
    if (hasSundayLastMinute) awardBadge('secret_last_minute');

    if (memberModified) {
      hasChanges = true;
      updatedMembers[member.id] = {
        ...member,
        unlocked_badges: existingUnlocked
      };
    }
  });

  // --- 2. Dynamic Wanderpokale (Trophy Owners) Calculation ---
  const trophyOwners = computeLiveTrophyOwners(allLogs, updatedMembers, data.trophyOwners || {});

  // Track if any trophy owner changed
  const oldTrophyOwners = data.trophyOwners || {};
  const allTrophyKeys = new Set([...Object.keys(trophyOwners), ...Object.keys(oldTrophyOwners)]);
  let trophyChanged = false;
  for (const k of allTrophyKeys) {
    if (trophyOwners[k] !== oldTrophyOwners[k]) {
      trophyChanged = true;
      break;
    }
  }
  if (trophyChanged) {
    hasChanges = true;
  }

  return {
    updatedMembers,
    newlyUnlockedForActiveUser,
    trophyOwners,
    hasChanges
  };
}
