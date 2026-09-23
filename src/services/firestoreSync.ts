import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChoreLog, FamilyData, FamilyMember, FamilySettings, TaskItem } from '../types';

export const HOUSEHOLD_ID = 'main_household';

/**
 * Upload entire local family dataset to Cloud Firestore
 */
export async function seedAllDataToCloud(data: FamilyData): Promise<void> {
  if (!auth.currentUser) return;

  try {
    const batch = writeBatch(db);

    // 1. Household doc
    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    batch.set(householdRef, {
      id: HOUSEHOLD_ID,
      household_name: data.settings.household_name || 'Familie Menet',
      default_weekly_target: data.settings.default_weekly_target || 50,
      categories: data.settings.categories || ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
      last_reset_date: data.settings.last_reset_date || new Date().toISOString(),
      color_theme: data.settings.color_theme || 'indigo',
      star_multiplier_1: data.settings.star_multiplier_1 ?? 50,
      star_multiplier_2: data.settings.star_multiplier_2 ?? 75,
      star_multiplier_3: data.settings.star_multiplier_3 ?? 100,
      rollover_surplus_factor: data.settings.rollover_surplus_factor ?? 100,
      rollover_deficit_factor: data.settings.rollover_deficit_factor ?? 100,
      rollover_min_target: data.settings.rollover_min_target ?? 10,
      rollover_max_target: data.settings.rollover_max_target ?? 200,
      week_start_day: data.settings.week_start_day || 'monday',
      allowed_emails: data.settings.allowed_emails || [],
      updatedAt: new Date().toISOString()
    });

    // 2. Members
    Object.values(data.members).forEach(member => {
      const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', member.id);
      batch.set(memberRef, {
        id: member.id,
        name: member.name,
        role: member.role,
        avatar_color: member.avatar_color,
        total_points: Number(member.total_points || 0),
        weekly_target: Number(member.weekly_target || 50),
        has_seen_tutorial: !!member.has_seen_tutorial,
        pin_code: member.pin_code || '',
        householdId: HOUSEHOLD_ID
      });
    });

    // 3. Tasks
    Object.values(data.tasks).forEach(task => {
      const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', task.id);
      batch.set(taskRef, {
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category,
        base_points: Number(task.base_points || 10),
        estimated_duration: Number(task.estimated_duration || 15),
        interval_days: Number(task.interval_days || 7),
        created_by: task.created_by || 'Admin',
        last_done: task.last_done || null,
        householdId: HOUSEHOLD_ID
      });
    });

    // 4. Logs (last 100 to avoid batch limits)
    data.logs.slice(0, 100).forEach(log => {
      const logRef = doc(db, 'households', HOUSEHOLD_ID, 'logs', log.log_id);
      batch.set(logRef, {
        ...log,
        householdId: HOUSEHOLD_ID
      });
    });

    await batch.commit();
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
    batch.set(logRef, {
      ...newLog,
      householdId: HOUSEHOLD_ID
    });

    const taskRef = doc(db, 'households', HOUSEHOLD_ID, 'tasks', updatedTask.id);
    batch.set(taskRef, {
      ...updatedTask,
      householdId: HOUSEHOLD_ID
    }, { merge: true });

    const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', updatedMember.id);
    batch.set(memberRef, {
      ...updatedMember,
      householdId: HOUSEHOLD_ID
    }, { merge: true });

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
      batch.set(taskRef, {
        ...updatedTask,
        householdId: HOUSEHOLD_ID
      }, { merge: true });
    }

    if (updatedMember) {
      const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', updatedMember.id);
      batch.set(memberRef, {
        ...updatedMember,
        householdId: HOUSEHOLD_ID
      }, { merge: true });
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
    await setDoc(taskRef, {
      ...task,
      householdId: HOUSEHOLD_ID
    }, { merge: true });
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
    await setDoc(memberRef, {
      ...member,
      householdId: HOUSEHOLD_ID
    }, { merge: true });
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
    await setDoc(householdRef, {
      ...settings,
      id: HOUSEHOLD_ID,
      household_name: settings.household_name || 'Familie Menet',
      categories: settings.categories || ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
      updatedAt: new Date().toISOString()
    }, { merge: true });
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
