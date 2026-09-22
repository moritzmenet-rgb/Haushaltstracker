import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ChoreLog, ColorTheme, FamilyData, FamilyMember, FamilySettings, TaskItem, UserRole, WeeklyRollOverPreview } from '../types';
import { INITIAL_FAMILY_DATA } from '../data/initialData';
import { calculatePoints, calculateRollOverTarget, getMemberCyclePoints } from '../utils';
import { applyColorTheme } from '../theme';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType, 
  User,
  isConfigValid
} from '../firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { 
  HOUSEHOLD_ID, 
  seedAllDataToCloud, 
  saveChoreLogToCloud, 
  deleteChoreLogFromCloud, 
  saveTaskToCloud, 
  deleteTaskFromCloud, 
  saveMemberToCloud, 
  deleteMemberFromCloud, 
  saveSettingsToCloud, 
  clearAllCloudData 
} from '../services/firestoreSync';

const STORAGE_KEY = 'household_chore_tracker_data_v3';
const ACTIVE_USER_KEY = 'household_chore_active_user_id';
const THEME_KEY = 'household_chore_theme';
const COLOR_THEME_KEY = 'household_chore_color_theme';

export type SyncStatus = 'offline' | 'connecting' | 'synced' | 'error';

interface AppContextType {
  isAppLoaded: boolean;
  data: FamilyData;
  activeUser: FamilyMember | null;
  isAdmin: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colorTheme: ColorTheme;
  effectiveTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  setActiveUserId: (id: string | null) => void;
  
  // Firebase Live Sync status & actions
  firebaseUser: User | null;
  syncStatus: SyncStatus;
  firebaseError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  uploadAllToCloud: () => Promise<void>;

  // Chore logging
  logChore: (taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string) => number;
  updateLog: (logId: string, updates: {
    task_id?: string;
    user_id?: string;
    stars?: 1 | 2 | 3;
    actual_duration?: number;
    notes?: string;
    timestamp?: string;
  }) => boolean;
  deleteLog: (logId: string) => boolean;

  // Task CRUD (Admin)
  createTask: (task: Omit<TaskItem, 'id' | 'created_by' | 'last_done'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (taskId: string) => void;

  // Category CRUD (Admin)
  addCategory: (category: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (category: string) => boolean;

  // Member CRUD (Admin & Account editing)
  addMember: (name: string, avatarColor: string, role: UserRole, weeklyTarget?: number, pinCode?: string) => void;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  updateProfile: (updates: Partial<Pick<FamilyMember, 'name' | 'avatar_color' | 'weekly_target' | 'pin_code'>>) => void;
  deleteMember: (memberId: string) => void;

  // Comprehensive Onboarding Tutorial
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;

  // App Rules & Reset (Admin)
  updateSettings: (updates: Partial<FamilySettings>) => void;
  updateDefaultWeeklyTarget: (newTarget: number) => void;
  getWeeklyRollOverPreview: () => WeeklyRollOverPreview[];
  executeWeeklyReset: () => void;

  // Data helpers
  clearAllData: () => Promise<void>;
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  // Force app to show after 2 seconds even if sync is still connecting
  useEffect(() => {
    console.log('AppContext: Initializing AppProvider...');
    const timer = setTimeout(() => {
      console.log('AppContext: 2s Force-Load Triggered');
      setIsAppLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // 4 Color Concepts state (indigo, emerald, rose, amber)
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme;
      if (saved && ['indigo', 'emerald', 'rose', 'amber'].includes(saved)) {
        return saved;
      }
    }
    return 'indigo';
  });

  // Onboarding Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Main Family Data state (with localStorage cache for instant load)
  const [data, setData] = useState<FamilyData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const v2 = localStorage.getItem('household_chore_tracker_data_v2');
        if (v2 && (v2.includes('Moritz') || v2.includes('task_101'))) {
          localStorage.removeItem('household_chore_tracker_data_v2');
        }
      } catch {
        // ignore
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.members?.user_admin?.name === 'Moritz' || parsed.tasks?.task_101)) {
            localStorage.removeItem(STORAGE_KEY);
            return INITIAL_FAMILY_DATA;
          }
          if (parsed && parsed.members && parsed.tasks) {
            return parsed;
          }
        } catch {
          // ignore error and fallback
        }
      }
    }
    return INITIAL_FAMILY_DATA;
  });

  // Active User ID state (which person on this specific device is active)
  const [activeUserId, setActiveUserIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(ACTIVE_USER_KEY);
      if (storedId === 'user_admin') {
        localStorage.removeItem(ACTIVE_USER_KEY);
        return null;
      }
      return storedId || null;
    }
    return null;
  });

  // Firebase Auth & Sync state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Update isAppLoaded when sync state is settled
  useEffect(() => {
    console.log('AppContext: syncStatus changed:', syncStatus);
    if (syncStatus === 'synced' || syncStatus === 'error' || syncStatus === 'offline') {
      setIsAppLoaded(true);
    }
  }, [syncStatus]);

  // Test Firestore connection on boot
  useEffect(() => {
    try {
      testFirestoreConnection();
    } catch (e) {
      console.error('Firestore connection test failed:', e);
    }
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('connecting');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore synchronizer when signed in
  useEffect(() => {
    if (!firebaseUser) return;

    setSyncStatus('connecting');
    const householdRef = doc(db, 'households', HOUSEHOLD_ID);
    const membersRef = collection(db, 'households', HOUSEHOLD_ID, 'members');
    const tasksRef = collection(db, 'households', HOUSEHOLD_ID, 'tasks');
    const logsRef = collection(db, 'households', HOUSEHOLD_ID, 'logs');

    let hasSeeded = false;

    let initialLoads = { household: false, members: false, tasks: false };
    
    const checkInitialSyncComplete = () => {
      if (initialLoads.household && initialLoads.members && initialLoads.tasks) {
        setSyncStatus('synced');
      }
    };

    // 1. Household settings listener
    const unsubHousehold = onSnapshot(
      householdRef,
      async (snap) => {
        try {
          if (!snap.exists()) {
            if (!hasSeeded) {
              hasSeeded = true;
              await seedAllDataToCloud(data);
            }
          } else {
            const hData = snap.data();
            if (hData) {
              setData(prev => {
                const nextData: FamilyData = {
                  ...prev,
                  settings: {
                    ...prev.settings,
                    household_name: hData.household_name || hData.name || prev.settings.household_name,
                    default_weekly_target: hData.default_weekly_target || prev.settings.default_weekly_target,
                    categories: hData.categories || prev.settings.categories,
                    last_reset_date: hData.last_reset_date || prev.settings.last_reset_date,
                    color_theme: hData.color_theme || prev.settings.color_theme,
                    star_multiplier_1: hData.star_multiplier_1 ?? prev.settings.star_multiplier_1,
                    star_multiplier_2: hData.star_multiplier_2 ?? prev.settings.star_multiplier_2,
                    star_multiplier_3: hData.star_multiplier_3 ?? prev.settings.star_multiplier_3,
                    rollover_surplus_factor: hData.rollover_surplus_factor ?? prev.settings.rollover_surplus_factor,
                    rollover_deficit_factor: hData.rollover_deficit_factor ?? prev.settings.rollover_deficit_factor,
                    rollover_min_target: hData.rollover_min_target ?? prev.settings.rollover_min_target,
                    rollover_max_target: hData.rollover_max_target ?? prev.settings.rollover_max_target,
                    week_start_day: hData.week_start_day || prev.settings.week_start_day,
                    allowed_emails: hData.allowed_emails || prev.settings.allowed_emails,
                  }
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
                return nextData;
              });
            }
          }
          initialLoads.household = true;
          checkInitialSyncComplete();
        } catch (err) {
          console.error('Error processing household snapshot:', err);
          setSyncStatus('error');
        }
      },
      (err) => {
        console.warn('Household snapshot listener failed:', err.message);
        setSyncStatus('error');
      }
    );

    // 2. Members subcollection listener
    const unsubMembers = onSnapshot(
      membersRef,
      (snap) => {
        const membersMap: Record<string, FamilyMember> = {};
        snap.forEach(docSnap => {
          const m = docSnap.data() as FamilyMember;
          membersMap[m.id] = m;
        });
        setData(prev => {
          const nextData: FamilyData = { ...prev, members: membersMap };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
          return nextData;
        });
        initialLoads.members = true;
        checkInitialSyncComplete();
      },
      (err) => {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.LIST, `households/${HOUSEHOLD_ID}/members`);
      }
    );

    // 3. Tasks subcollection listener
    const unsubTasks = onSnapshot(
      tasksRef,
      (snap) => {
        const tasksMap: Record<string, TaskItem> = {};
        snap.forEach(docSnap => {
          const t = docSnap.data() as TaskItem;
          tasksMap[t.id] = t;
        });
        setData(prev => {
          const nextData: FamilyData = { ...prev, tasks: tasksMap };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
          return nextData;
        });
        initialLoads.tasks = true;
        checkInitialSyncComplete();
      },
      (err) => {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.LIST, `households/${HOUSEHOLD_ID}/tasks`);
      }
    );

    // 4. Logs subcollection listener
    const unsubLogs = onSnapshot(
      logsRef,
      (snap) => {
        const logsList: ChoreLog[] = [];
        snap.forEach(docSnap => {
          logsList.push(docSnap.data() as ChoreLog);
        });
        // Sort newest first
        logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setData(prev => {
          const nextData: FamilyData = { ...prev, logs: logsList };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
          return nextData;
        });
        setSyncStatus('synced');
      },
      (err) => {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.LIST, `households/${HOUSEHOLD_ID}/logs`);
      }
    );

    return () => {
      unsubHousehold();
      unsubMembers();
      unsubTasks();
      unsubLogs();
    };
  }, [firebaseUser]);

  // Keep state synced with localStorage and BroadcastChannel for local/offline tabs
  const persistLocal = useCallback((newData: FamilyData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    try {
      const channel = new BroadcastChannel('household_chore_sync');
      channel.postMessage({ type: 'DATA_UPDATE', payload: newData });
      channel.close();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
      if (e.key === ACTIVE_USER_KEY) {
        setActiveUserIdState(e.newValue);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('household_chore_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'DATA_UPDATE' && event.data?.payload) {
          setData(event.data.payload);
        }
      };
    } catch {
      // ignore
    }

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, []);

  const setActiveUserId = useCallback((id: string | null) => {
    setActiveUserIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_USER_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  }, []);

  const activeUser = useMemo(() => {
    if (!activeUserId) return null;
    return data.members[activeUserId] || null;
  }, [activeUserId, data.members]);

  // Admin permission: user role is admin OR signed in with admin email OR initial setup mode (0 members)
  const isAdmin = useMemo(() => {
    if (firebaseUser?.email === 'moritz.menet.bfsu@gmail.com') return true;
    // If no members exist yet, grant admin privileges so setup/first user creation isn't blocked
    if (Object.keys(data.members).length === 0) return true;
    if (!activeUser) return false;
    return activeUser.role === 'admin';
  }, [activeUser, firebaseUser, data.members]);

  // Effective color theme (User's chosen theme)
  const effectiveTheme: ColorTheme = colorTheme;

  // Color Theme handlers
  const setColorTheme = useCallback((newTheme: ColorTheme) => {
    setColorThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(COLOR_THEME_KEY, newTheme);
    }
    applyColorTheme(newTheme);
    
    if (data.settings.color_theme !== newTheme) {
      const updatedSettings = { ...data.settings, color_theme: newTheme };
      persistLocal({ ...data, settings: updatedSettings });
      if (firebaseUser) {
        saveSettingsToCloud(updatedSettings).catch(err => console.error('Firestore saveSettings error:', err));
      }
    }
  }, [data, firebaseUser, persistLocal]);

  // Sync effective color theme attribute on mount and state change
  useEffect(() => {
    applyColorTheme(effectiveTheme);
  }, [effectiveTheme]);

  // If cloud data brings in an existing theme preference, apply it
  useEffect(() => {
    if (data.settings.color_theme && data.settings.color_theme !== colorTheme) {
      const saved = localStorage.getItem(COLOR_THEME_KEY);
      if (!saved) {
        setColorThemeState(data.settings.color_theme);
      }
    }
  }, [data.settings.color_theme, colorTheme]);

  // Tutorial trigger: if active user has not yet seen the tutorial, open it
  useEffect(() => {
    if (activeUser && activeUser.has_seen_tutorial === false) {
      setIsTutorialOpen(true);
    }
  }, [activeUser?.id, activeUser?.has_seen_tutorial]);

  const openTutorial = useCallback(() => {
    setIsTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    if (activeUser) {
      const updatedMember: FamilyMember = {
        ...activeUser,
        has_seen_tutorial: true
      };
      persistLocal({
        ...data,
        members: {
          ...data.members,
          [activeUser.id]: updatedMember
        }
      });
      if (firebaseUser) {
        saveMemberToCloud(updatedMember).catch(err => console.error('Cloud saveMember error:', err));
      }
    }
  }, [activeUser, data, firebaseUser, persistLocal]);

  // Auth actions
  const loginWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('connecting');
      setFirebaseError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncStatus('error');
      
      if (err.code === 'auth/unauthorized-domain') {
        setFirebaseError('unauthorized-domain');
      } else {
        setFirebaseError(err.message || 'Login fehlgeschlagen');
      }
    }
  }, []);

  const logoutFirebase = useCallback(async () => {
    try {
      await signOut(auth);
      setSyncStatus('offline');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const uploadAllToCloud = useCallback(async () => {
    if (!firebaseUser) return;
    setSyncStatus('connecting');
    await seedAllDataToCloud(data);
    setSyncStatus('synced');
  }, [firebaseUser, data]);

  // CHORE LOGGING
  const logChore = useCallback((taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string): number => {
    if (!activeUser) return 0;
    const task = data.tasks[taskId];
    if (!task) return 0;

    const pointsAwarded = calculatePoints(task.base_points, stars, data.settings);
    const nowIso = new Date().toISOString();
    const newLog: ChoreLog = {
      log_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      task_id: taskId,
      user_id: activeUser.id,
      stars,
      points_awarded: pointsAwarded,
      actual_duration: actualDuration,
      timestamp: nowIso,
      notes: notes?.trim() ? notes.trim() : undefined
    };

    const updatedTask: TaskItem = {
      ...task,
      last_done: nowIso
    };

    const currentMember = data.members[activeUser.id];
    const updatedMember: FamilyMember = {
      ...currentMember,
      total_points: (currentMember.total_points || 0) + pointsAwarded
    };

    const updatedTasks = {
      ...data.tasks,
      [taskId]: updatedTask
    };

    const updatedMembers = {
      ...data.members,
      [activeUser.id]: updatedMember
    };

    const updatedLogs = [newLog, ...data.logs];

    // 1. Update local state immediately
    persistLocal({
      ...data,
      tasks: updatedTasks,
      members: updatedMembers,
      logs: updatedLogs
    });

    // 2. Persist to Firestore if signed in
    if (firebaseUser) {
      saveChoreLogToCloud(newLog, updatedTask, updatedMember).catch(err => {
        console.error('Firestore saveChoreLog error:', err);
      });
    }

    return pointsAwarded;
  }, [activeUser, data, firebaseUser, persistLocal]);

  // UPDATE LOG (User can edit own log, Admin can edit any log)
  const updateLog = useCallback((
    logId: string, 
    updates: {
      task_id?: string;
      user_id?: string;
      stars?: 1 | 2 | 3;
      actual_duration?: number;
      notes?: string;
      timestamp?: string;
    }
  ): boolean => {
    const oldLog = data.logs.find(l => l.log_id === logId);
    if (!oldLog) return false;

    const canEdit = isAdmin || (activeUser && activeUser.id === oldLog.user_id);
    if (!canEdit) return false;

    const targetTaskId = updates.task_id || oldLog.task_id;
    const targetUserId = (isAdmin && updates.user_id) ? updates.user_id : oldLog.user_id;
    const targetStars = updates.stars || oldLog.stars;
    const targetActualDuration = updates.actual_duration !== undefined ? updates.actual_duration : oldLog.actual_duration;
    const targetTimestamp = updates.timestamp || oldLog.timestamp;
    const targetNotes = updates.notes !== undefined ? (updates.notes.trim() || undefined) : oldLog.notes;

    const task = data.tasks[targetTaskId];
    const newPointsAwarded = task
      ? calculatePoints(task.base_points, targetStars, data.settings)
      : oldLog.points_awarded;

    const updatedLog: ChoreLog = {
      ...oldLog,
      task_id: targetTaskId,
      user_id: targetUserId,
      stars: targetStars,
      actual_duration: targetActualDuration,
      timestamp: targetTimestamp,
      notes: targetNotes,
      points_awarded: newPointsAwarded
    };

    // Calculate member point adjustments
    const updatedMembers = { ...data.members };
    let primaryUpdatedMember: FamilyMember | undefined;

    if (targetUserId === oldLog.user_id) {
      // Same member: adjust by difference between new and old points
      const member = updatedMembers[targetUserId];
      if (member) {
        const delta = newPointsAwarded - oldLog.points_awarded;
        const newTotal = Math.max(0, (member.total_points || 0) + delta);
        updatedMembers[targetUserId] = {
          ...member,
          total_points: newTotal
        };
        primaryUpdatedMember = updatedMembers[targetUserId];
      }
    } else {
      // Reassigned to another member by admin
      const oldMember = updatedMembers[oldLog.user_id];
      if (oldMember) {
        updatedMembers[oldLog.user_id] = {
          ...oldMember,
          total_points: Math.max(0, (oldMember.total_points || 0) - oldLog.points_awarded)
        };
      }
      const newMember = updatedMembers[targetUserId];
      if (newMember) {
        updatedMembers[targetUserId] = {
          ...newMember,
          total_points: (newMember.total_points || 0) + newPointsAwarded
        };
        primaryUpdatedMember = updatedMembers[targetUserId];
      }
    }

    // Replace in logs list
    const updatedLogs = data.logs.map(l => (l.log_id === logId ? updatedLog : l));

    // Recompute last_done for affected tasks
    const updatedTasks = { ...data.tasks };
    const tasksToRecompute = new Set([oldLog.task_id, targetTaskId]);
    tasksToRecompute.forEach(tid => {
      const remainingLogs = updatedLogs.filter(l => l.task_id === tid);
      let latestDone: string | null = null;
      if (remainingLogs.length > 0) {
        latestDone = remainingLogs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0].timestamp;
      }
      if (updatedTasks[tid]) {
        updatedTasks[tid] = {
          ...updatedTasks[tid],
          last_done: latestDone
        };
      }
    });

    persistLocal({
      ...data,
      members: updatedMembers,
      tasks: updatedTasks,
      logs: updatedLogs
    });

    if (firebaseUser) {
      const taskForCloud = updatedTasks[targetTaskId] || data.tasks[targetTaskId];
      if (primaryUpdatedMember && taskForCloud) {
        saveChoreLogToCloud(updatedLog, taskForCloud, primaryUpdatedMember).catch(err => {
          console.error('Firestore saveChoreLog error on update:', err);
        });
      }
      if (targetUserId !== oldLog.user_id && updatedMembers[oldLog.user_id]) {
        saveMemberToCloud(updatedMembers[oldLog.user_id]).catch(err => {
          console.error('Firestore saveMember error for old user:', err);
        });
      }
    }

    return true;
  }, [isAdmin, activeUser, data, firebaseUser, persistLocal]);

  // DELETE LOG (User can delete own log, Admin can delete any log)
  const deleteLog = useCallback((logId: string): boolean => {
    const logToDelete = data.logs.find(l => l.log_id === logId);
    if (!logToDelete) return false;

    const canDelete = isAdmin || (activeUser && activeUser.id === logToDelete.user_id);
    if (!canDelete) return false;

    // Deduct points from user
    const member = data.members[logToDelete.user_id];
    let updatedMember: FamilyMember | undefined = undefined;
    const updatedMembers = { ...data.members };
    if (member) {
      updatedMember = {
        ...member,
        total_points: Math.max(0, (member.total_points || 0) - logToDelete.points_awarded)
      };
      updatedMembers[member.id] = updatedMember;
    }

    const updatedLogs = data.logs.filter(l => l.log_id !== logId);

    // Recompute last_done for this task
    const remainingTaskLogs = updatedLogs.filter(l => l.task_id === logToDelete.task_id);
    let newLastDone: string | null = null;
    if (remainingTaskLogs.length > 0) {
      newLastDone = remainingTaskLogs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0].timestamp;
    }

    let updatedTask: TaskItem | undefined = undefined;
    const updatedTasks = { ...data.tasks };
    if (updatedTasks[logToDelete.task_id]) {
      updatedTask = {
        ...updatedTasks[logToDelete.task_id],
        last_done: newLastDone
      };
      updatedTasks[logToDelete.task_id] = updatedTask;
    }

    persistLocal({
      ...data,
      members: updatedMembers,
      tasks: updatedTasks,
      logs: updatedLogs
    });

    if (firebaseUser) {
      deleteChoreLogFromCloud(logId, updatedTask, updatedMember).catch(err => {
        console.error('Firestore deleteChoreLog error:', err);
      });
    }

    return true;
  }, [isAdmin, data, firebaseUser, persistLocal]);

  // TASK CRUD (Admin)
  const createTask = useCallback((taskInput: Omit<TaskItem, 'id' | 'created_by' | 'last_done'>) => {
    if (!isAdmin || !activeUser) return;
    const newId = `task_${Date.now()}`;
    const newTask: TaskItem = {
      ...taskInput,
      id: newId,
      created_by: activeUser.name,
      last_done: null
    };

    persistLocal({
      ...data,
      tasks: {
        ...data.tasks,
        [newId]: newTask
      }
    });

    if (firebaseUser) {
      saveTaskToCloud(newTask).catch(err => {
        console.error('Firestore saveTask error:', err);
      });
    }
  }, [isAdmin, activeUser, data, firebaseUser, persistLocal]);

  const updateTask = useCallback((taskId: string, updates: Partial<TaskItem>) => {
    if (!isAdmin) return;
    if (!data.tasks[taskId]) return;

    const updatedTask: TaskItem = {
      ...data.tasks[taskId],
      ...updates
    };

    persistLocal({
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: updatedTask
      }
    });

    if (firebaseUser) {
      saveTaskToCloud(updatedTask).catch(err => {
        console.error('Firestore saveTask error:', err);
      });
    }
  }, [isAdmin, data, firebaseUser, persistLocal]);

  const deleteTask = useCallback((taskId: string) => {
    if (!isAdmin) return;
    const updatedTasks = { ...data.tasks };
    delete updatedTasks[taskId];

    persistLocal({
      ...data,
      tasks: updatedTasks
    });

    if (firebaseUser) {
      deleteTaskFromCloud(taskId).catch(err => {
        console.error('Firestore deleteTask error:', err);
      });
    }
  }, [isAdmin, data, firebaseUser, persistLocal]);

  // CATEGORY CRUD (Admin)
  const addCategory = useCallback((category: string): boolean => {
    if (!isAdmin) return false;
    const trimmed = category.trim();
    if (!trimmed || data.settings.categories.includes(trimmed)) return false;

    const newSettings = {
      ...data.settings,
      categories: [...data.settings.categories, trimmed]
    };

    persistLocal({
      ...data,
      settings: newSettings
    });

    if (firebaseUser) {
      saveSettingsToCloud(newSettings).catch(err => console.error('Firestore saveSettings error:', err));
    }

    return true;
  }, [isAdmin, data, firebaseUser, persistLocal]);

  const renameCategory = useCallback((oldName: string, newName: string): boolean => {
    if (!isAdmin) return false;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;

    const updatedCategories = data.settings.categories.map(c => (c === oldName ? trimmed : c));
    const updatedTasks = { ...data.tasks };
    Object.keys(updatedTasks).forEach(tid => {
      if (updatedTasks[tid].category === oldName) {
        updatedTasks[tid] = { ...updatedTasks[tid], category: trimmed };
      }
    });

    const newSettings = {
      ...data.settings,
      categories: updatedCategories
    };

    persistLocal({
      ...data,
      settings: newSettings,
      tasks: updatedTasks
    });

    if (firebaseUser) {
      saveSettingsToCloud(newSettings).catch(err => console.error('Firestore saveSettings error:', err));
      Object.values(updatedTasks).forEach(t => saveTaskToCloud(t));
    }

    return true;
  }, [isAdmin, data, firebaseUser, persistLocal]);

  const deleteCategory = useCallback((category: string): boolean => {
    if (!isAdmin) return false;
    if (data.settings.categories.length <= 1) return false;

    const updatedCategories = data.settings.categories.filter(c => c !== category);
    const fallbackCategory = updatedCategories[0] || 'Allgemein';
    const updatedTasks = { ...data.tasks };
    Object.keys(updatedTasks).forEach(tid => {
      if (updatedTasks[tid].category === category) {
        updatedTasks[tid] = { ...updatedTasks[tid], category: fallbackCategory };
      }
    });

    const newSettings = {
      ...data.settings,
      categories: updatedCategories
    };

    persistLocal({
      ...data,
      settings: newSettings,
      tasks: updatedTasks
    });

    if (firebaseUser) {
      saveSettingsToCloud(newSettings).catch(err => console.error('Firestore saveSettings error:', err));
      Object.values(updatedTasks).forEach(t => saveTaskToCloud(t));
    }

    return true;
  }, [isAdmin, data, firebaseUser, persistLocal]);

  // MEMBER CRUD (Admin-only creation & role control, plus self-profile editing)
  const addMember = useCallback((name: string, avatarColor: string, role: UserRole, weeklyTarget?: number, pinCode?: string) => {
    const isFirstMember = Object.keys(data.members).length === 0;
    if (!isAdmin && !isFirstMember) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = `user_${Date.now()}`;
    const effectiveRole: UserRole = isFirstMember ? 'admin' : role;
    const newMember: FamilyMember = {
      id: newId,
      name: trimmed,
      role: effectiveRole,
      avatar_color: avatarColor || '#4F46E5',
      total_points: 0,
      weekly_target: weeklyTarget || data.settings.default_weekly_target || 50,
      pin_code: pinCode?.trim() ? pinCode.trim() : undefined,
      has_seen_tutorial: false
    };

    persistLocal({
      ...data,
      members: {
        ...data.members,
        [newId]: newMember
      }
    });

    if (firebaseUser) {
      saveMemberToCloud(newMember).catch(err => console.error('Firestore saveMember error:', err));
    }
  }, [isAdmin, data, firebaseUser, persistLocal]);

  const updateMember = useCallback((memberId: string, updates: Partial<FamilyMember>) => {
    if (!data.members[memberId]) return;
    const isSelf = activeUser?.id === memberId;
    if (!isAdmin && !isSelf) return;

    // Security: Only admins can change user roles (decide who is admin)
    const cleanUpdates = { ...updates };
    if (!isAdmin && 'role' in cleanUpdates) {
      delete cleanUpdates.role;
    }

    const updatedMember: FamilyMember = {
      ...data.members[memberId],
      ...cleanUpdates
    };

    persistLocal({
      ...data,
      members: {
        ...data.members,
        [memberId]: updatedMember
      }
    });

    if (firebaseUser) {
      saveMemberToCloud(updatedMember).catch(err => console.error('Firestore saveMember error:', err));
    }
  }, [isAdmin, activeUser, data, firebaseUser, persistLocal]);

  // Account editing method for current active user
  const updateProfile = useCallback((updates: Partial<Pick<FamilyMember, 'name' | 'avatar_color' | 'weekly_target' | 'pin_code'>>) => {
    if (!activeUser) return;
    updateMember(activeUser.id, updates);
  }, [activeUser, updateMember]);

  const deleteMember = useCallback((memberId: string) => {
    if (!isAdmin) return;

    const updatedMembers = { ...data.members };
    delete updatedMembers[memberId];

    if (activeUserId === memberId) {
      setActiveUserId(null);
    }

    persistLocal({
      ...data,
      members: updatedMembers
    });

    if (firebaseUser) {
      deleteMemberFromCloud(memberId).catch(err => console.error('Firestore deleteMember error:', err));
    }
  }, [isAdmin, activeUserId, data, firebaseUser, persistLocal, setActiveUserId]);

  // APP RULES & WEEKLY RESET (Admin)
  const updateSettings = useCallback((updates: Partial<FamilySettings>) => {
    if (!isAdmin) return;
    const newSettings: FamilySettings = {
      ...data.settings,
      ...updates
    };

    persistLocal({
      ...data,
      settings: newSettings
    });

    if (firebaseUser) {
      saveSettingsToCloud(newSettings).catch(err => console.error('Firestore saveSettings error:', err));
    }
  }, [isAdmin, data, firebaseUser, persistLocal]);

  const updateDefaultWeeklyTarget = useCallback((newTarget: number) => {
    if (!isAdmin || newTarget < 10) return;
    updateSettings({ default_weekly_target: newTarget });
  }, [isAdmin, updateSettings]);

  const getWeeklyRollOverPreview = useCallback((): WeeklyRollOverPreview[] => {
    const baseDefault = data.settings.default_weekly_target || 50;
    return Object.values(data.members).map(member => {
      const cyclePoints = getMemberCyclePoints(member.id, data.logs, data.settings.last_reset_date);
      const oldTarget = member.weekly_target || baseDefault;
      const difference = oldTarget - cyclePoints;
      const factor = difference > 0
        ? (data.settings.rollover_deficit_factor ?? 100)
        : (data.settings.rollover_surplus_factor ?? 100);
      const newTarget = calculateRollOverTarget(baseDefault, oldTarget, cyclePoints, {
        minTarget: data.settings.rollover_min_target ?? 10,
        maxTarget: data.settings.rollover_max_target ?? 200,
        factor
      });
      return {
        memberId: member.id,
        memberName: member.name,
        oldTarget,
        achievedPoints: cyclePoints,
        difference,
        newTarget
      };
    });
  }, [data]);

  const executeWeeklyReset = useCallback(() => {
    if (!isAdmin) return;
    const baseDefault = data.settings.default_weekly_target || 50;
    const updatedMembers = { ...data.members };

    Object.values(updatedMembers).forEach(member => {
      const cyclePoints = getMemberCyclePoints(member.id, data.logs, data.settings.last_reset_date);
      const oldTarget = member.weekly_target || baseDefault;
      const difference = oldTarget - cyclePoints;
      const factor = difference > 0
        ? (data.settings.rollover_deficit_factor ?? 100)
        : (data.settings.rollover_surplus_factor ?? 100);
      const newTarget = calculateRollOverTarget(baseDefault, oldTarget, cyclePoints, {
        minTarget: data.settings.rollover_min_target ?? 10,
        maxTarget: data.settings.rollover_max_target ?? 200,
        factor
      });
      updatedMembers[member.id] = {
        ...member,
        weekly_target: newTarget
      };
    });

    const newSettings: FamilySettings = {
      ...data.settings,
      last_reset_date: new Date().toISOString()
    };

    persistLocal({
      ...data,
      settings: newSettings,
      members: updatedMembers
    });

    if (firebaseUser) {
      saveSettingsToCloud(newSettings).catch(err => console.error('Firestore saveSettings error:', err));
      Object.values(updatedMembers).forEach(m => saveMemberToCloud(m));
    }
  }, [isAdmin, data, firebaseUser, persistLocal]);

  // DATA HELPERS
  const clearAllData = useCallback(async () => {
    const emptyData: FamilyData = {
      settings: {
        default_weekly_target: 50,
        categories: ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
        last_reset_date: new Date().toISOString()
      },
      members: {},
      tasks: {},
      logs: []
    };
    persistLocal(emptyData);
    setActiveUserId(null);
    if (firebaseUser) {
      try {
        await clearAllCloudData();
      } catch (err) {
        console.error('Firestore clearAllCloudData error:', err);
      }
    }
  }, [firebaseUser, persistLocal, setActiveUserId]);

  const resetToDemoData = useCallback(() => {
    persistLocal(INITIAL_FAMILY_DATA);
    setActiveUserId(null);
    if (firebaseUser) {
      seedAllDataToCloud(INITIAL_FAMILY_DATA).catch(err => console.error('Firestore seed error:', err));
    }
  }, [firebaseUser, persistLocal, setActiveUserId]);

  const exportDataJSON = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importDataJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.members && parsed.tasks && parsed.settings) {
        persistLocal(parsed);
        if (firebaseUser) {
          seedAllDataToCloud(parsed).catch(err => console.error('Firestore seed error:', err));
        }
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [firebaseUser, persistLocal]);

  return (
    <AppContext.Provider
      value={{
        isAppLoaded,
        data,
        activeUser,
        isAdmin,
        theme,
        toggleTheme,
        colorTheme,
        effectiveTheme,
        setColorTheme,
        setActiveUserId,
        firebaseUser,
        syncStatus,
        firebaseError,
        loginWithGoogle,
        logoutFirebase,
        uploadAllToCloud,
        logChore,
        updateLog,
        deleteLog,
        createTask,
        updateTask,
        deleteTask,
        addCategory,
        renameCategory,
        deleteCategory,
        addMember,
        updateMember,
        updateProfile,
        deleteMember,
        isTutorialOpen,
        openTutorial,
        closeTutorial,
        completeTutorial,
        updateSettings,
        updateDefaultWeeklyTarget,
        getWeeklyRollOverPreview,
        executeWeeklyReset,
        clearAllData,
        resetToDemoData,
        exportDataJSON,
        importDataJSON
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
