import { 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChoreLog, FamilyData, FamilyMember, FamilySettings, TaskItem } from '../types';

export const HOUSEHOLD_ID = 'main_household';

/**
 * Sanitize household settings for Firestore
 */
function sanitizeSettings(settings?: Partial<FamilySettings>): Record<string, any> {
  const s = settings || {};
  return {
    id: HOUSEHOLD_ID,
    household_name: s.household_name || 'Familie Menet',
    default_weekly_target: Number(s.default_weekly_target ?? 50),
    categories: Array.isArray(s.categories) && s.categories.length > 0 
      ? s.categories 
      : ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
    last_reset_date: s.last_reset_date || new Date().toISOString(),
    color_theme: s.color_theme || 'indigo',
    star_multiplier_1: Number(s.star_multiplier_1 ?? 50),
    star_multiplier_2: Number(s.star_multiplier_2 ?? 75),
    star_multiplier_3: Number(s.star_multiplier_3 ?? 100),
    rollover_surplus_factor: Number(s.rollover_surplus_factor ?? 100),
    rollover_deficit_factor: Number(s.rollover_deficit_factor ?? 100),
    rollover_min_target: Number(s.rollover_min_target ?? 10),
    rollover_max_target: Number(s.rollover_max_target ?? 200),
    week_start_day: s.week_start_day || 'monday',
    allowed_emails: Array.isArray(s.allowed_emails) ? s.allowed_emails : [],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Sanitize a family member object for Firestore
 */
function sanitizeMember(member: FamilyMember): Record<string, any> {
  return {
    id: member.id,
    name: member.name || 'Familienmitglied',
    role: member.role === 'admin' ? 'admin' : 'member',
    avatar_color: member.avatar_color || '#4F46E5',
    total_points: Number(member.total_points || 0),
    weekly_target: Number(member.weekly_target || 50),
    has_seen_tutorial: Boolean(member.has_seen_tutorial),
    pin_code: member.pin_code || '',
    householdId: HOUSEHOLD_ID
  };
}

/**
 * Sanitize a task object for Firestore
 */
function sanitizeTask(task: TaskItem): Record<string, any> {
  return {
    id: task.id,
    title: task.title || 'Aufgabe',
    description: task.description || '',
    category: task.category || 'Allgemein',
    base_points: Number(task.base_points || 10),
    estimated_duration: Number(task.estimated_duration || 15),
    interval_days: Number(task.interval_days || 7),
    created_by: task.created_by || 'Admin',
    last_done: task.last_done ? String(task.last_done) : '',
    householdId: HOUSEHOLD_ID
  };
}

/**
 * Sanitize a log item for Firestore
 */
function sanitizeLog(log: ChoreLog): Record<string, any> {
  return {
    log_id: log.log_id,
    task_id: log.task_id,
    user_id: log.user_id,
    stars: Number(log.stars || 2),
    points_awarded: Number(log.points_awarded || 10),
    actual_duration: Number(log.actual_duration || 10),
    timestamp: log.timestamp || new Date().toISOString(),
    notes: log.notes || '',
    householdId: HOUSEHOLD_ID
  };
}

/**
 * Check if the household is initialized in Cloud Firestore
 */
export async function isHouseholdInitializedInCloud(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    const snap = await getDoc(householdRef);
    return snap.exists();
  } catch (error) {
    console.warn('Check household exists notice:', error);
    return false;
  }
}

/**
 * Upload entire local family dataset to Cloud Firestore
 */
export async function seedAllDataToCloud(data: FamilyData): Promise<void> {
  if (!auth.currentUser) return;

  try {
    // 1. Household doc (set directly with merge)
    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    await setDoc(householdRef, sanitizeSettings(data.settings), { merge: true });

    // 2. Subcollections if any items exist
    const membersToSeed = Object.values(data.members || {});
    const tasksToSeed = Object.values(data.tasks || {});
    const logsToSeed = (data.logs || []).slice(0, 50);

    if (membersToSeed.length > 0 || tasksToSeed.length > 0 || logsToSeed.length > 0) {
      const batch = writeBatch(db);

      membersToSeed.forEach(member => {
        const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', member.id);
        batch.set(memberRef, sanitizeMember(member), { merge: true });
      });

      tasksToSeed.forEach(task => {
        const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', task.id);
        batch.set(taskRef, sanitizeTask(task), { merge: true });
      });

      logsToSeed.forEach(log => {
        const logRef = doc(db, 'households', HOUSEHOLD_ID, 'logs', log.log_id);
        batch.set(logRef, sanitizeLog(log), { merge: true });
      });

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}`);
  }
}

/**
 * Hard-Reset and completely rebuild all Firebase Cloud data from scratch
 */
export async function resetAndRebuildCloudData(data: FamilyData): Promise<void> {
  if (!auth.currentUser) return;

  try {
    // Step 1: Delete all existing subcollection docs if any exist
    const membersSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'members'));
    const tasksSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'tasks'));
    const logsSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'logs'));

    const hasDocsToDelete = (membersSnap.size > 0 || tasksSnap.size > 0 || logsSnap.size > 0);
    if (hasDocsToDelete) {
      const deleteBatch = writeBatch(db);
      membersSnap.forEach(d => deleteBatch.delete(d.ref));
      tasksSnap.forEach(d => deleteBatch.delete(d.ref));
      logsSnap.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    // Step 2: Seed new pristine dataset
    await seedAllDataToCloud(data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}`);
  }
}

/**
 * Persist a newly completed chore log and update task/member totals in Firestore
 */
export async function saveChoreLogToCloud(
  newLog: ChoreLog, 
  updatedTask: TaskItem, 
  updatedMember: FamilyMember
): Promise<void> {
  if (!auth.currentUser) return;

  try {
    const batch = writeBatch(db);

    const logRef = doc(db, 'households', HOUSEHOLD_ID, 'logs', newLog.log_id);
    batch.set(logRef, sanitizeLog(newLog));

    const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', updatedTask.id);
    batch.set(taskRef, sanitizeTask(updatedTask), { merge: true });

    const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', updatedMember.id);
    batch.set(memberRef, sanitizeMember(updatedMember), { merge: true });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}/logs/${newLog.log_id}`);
  }
}

export async function deleteChoreLogFromCloud(
  logId: string, 
  updatedTask?: TaskItem, 
  updatedMember?: FamilyMember
): Promise<void> {
  if (!auth.currentUser) return;

  try {
    const batch = writeBatch(db);
    const logRef = doc(db, 'households', HOUSEHOLD_ID, 'logs', logId);
    batch.delete(logRef);

    if (updatedTask) {
      const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', updatedTask.id);
      batch.set(taskRef, sanitizeTask(updatedTask), { merge: true });
    }

    if (updatedMember) {
      const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', updatedMember.id);
      batch.set(memberRef, sanitizeMember(updatedMember), { merge: true });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `households/${HOUSEHOLD_ID}/logs/${logId}`);
  }
}

export async function saveTaskToCloud(task: TaskItem): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', task.id);
    await setDoc(taskRef, sanitizeTask(task), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}/tasks/${task.id}`);
  }
}

export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `households/${HOUSEHOLD_ID}/tasks/${taskId}`);
  }
}

export async function saveMemberToCloud(member: FamilyMember): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', member.id);
    await setDoc(memberRef, sanitizeMember(member), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}/members/${member.id}`);
  }
}

export async function deleteMemberFromCloud(memberId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `households/${HOUSEHOLD_ID}/members/${memberId}`);
  }
}

export async function saveSettingsToCloud(settings: FamilySettings): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    await setDoc(householdRef, sanitizeSettings(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}`);
  }
}

export async function clearAllCloudData(): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const batch = writeBatch(db);

    const membersSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'members'));
    membersSnap.forEach(d => batch.delete(d.ref));

    const tasksSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'tasks'));
    tasksSnap.forEach(d => batch.delete(d.ref));

    const logsSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'logs'));
    logsSnap.forEach(d => batch.delete(d.ref));

    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    batch.delete(householdRef);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}`);
  }
}
