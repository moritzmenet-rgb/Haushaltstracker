import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ChoreLog, ColorTheme, FamilyData, FamilyMember, FamilySettings, SessionLog, TaskItem, UserRole, WeeklyRollOverPreview } from '../types';
import { INITIAL_FAMILY_DATA, DEMO_FAMILY_DATA, DEFAULT_HOUSEHOLD_TASKS } from '../data/initialData';
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
  User
} from '../firebase';
import { doc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  HOUSEHOLD_ID, 
  seedAllDataToCloud, 
  resetAndRebuildCloudData,
  saveChoreLogToCloud, 
  deleteChoreLogFromCloud, 
  saveTaskToCloud, 
  deleteTaskFromCloud, 
  saveMemberToCloud, 
  deleteMemberFromCloud, 
  saveSettingsToCloud, 
  clearAllCloudData 
} from '../services/firestoreSync';

const STORAGE_KEY = 'household_chore_tracker_data_v5';
const ACTIVE_USER_KEY = 'household_chore_active_user_id';
const THEME_KEY = 'household_chore_theme';
const COLOR_THEME_KEY = 'household_chore_color_theme';

export type SyncStatus = 'offline' | 'connecting' | 'synced' | 'error';

export type SyncOperationStatus = 'idle' | 'uploading' | 'saved' | 'error';

export interface SyncFeedback {
  status: SyncOperationStatus;
  text: string;
  timestamp?: number;
}

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
  syncFeedback: SyncFeedback;
  firebaseError: string | null;
  isAuthResolving: boolean;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  uploadAllToCloud: () => Promise<void>;
  resetFirebaseCompletely: () => Promise<void>;
  retrySync: () => void;

  // Chore logging
  logChore: (taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string) => Promise<number>;
  updateLog: (logId: string, updates: {
    task_id?: string;
    user_id?: string;
    stars?: 1 | 2 | 3;
    actual_duration?: number;
    notes?: string;
    timestamp?: string;
  }) => Promise<boolean>;
  deleteLog: (logId: string) => Promise<boolean>;

  // Task CRUD (Admin)
  createTask: (task: Omit<TaskItem, 'id' | 'created_by' | 'last_done'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (taskId: string) => void;

  // Category CRUD (Admin)
  addCategory: (category: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (category: string) => boolean;

  // Member CRUD (Admin & Account editing)
  addMember: (name: string, avatarColor: string, role: UserRole, weeklyTarget?: number, pinCode?: string) => Promise<FamilyMember>;
  initializeAdminProfile: (name: string, avatarColor?: string, withDefaultTasks?: boolean) => Promise<FamilyMember>;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  updateProfile: (updates: Partial<Pick<FamilyMember, 'name' | 'avatar_color' | 'weekly_target' | 'pin_code'>>) => void;
  deleteMember: (memberId: string) => void;

  // Session & Security
  sessions: SessionLog[];
  recordSession: (user: User) => Promise<void>;
  blockUserByEmail: (email: string) => Promise<void>;
  unblockUserByEmail: (email: string) => Promise<void>;
  blockedEmails: string[];

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
  resetToDemoData: () => Promise<void>;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [isAuthResolving, setIsAuthResolving] = useState(true);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark')), []);

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme;
      if (saved && ['indigo', 'emerald', 'rose', 'amber'].includes(saved)) return saved;
    }
    return 'indigo';
  });

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const [data, setData] = useState<FamilyData>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.members && parsed.tasks) return parsed;
        } catch { /* ignore */ }
      }
    }
    return INITIAL_FAMILY_DATA;
  });

  const [activeUserId, setActiveUserIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(ACTIVE_USER_KEY) || null;
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback>({ status: 'idle', text: '' });
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSyncFeedback = useCallback((actionName: string, cloudPromise?: Promise<any>) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (!firebaseUser) {
      setSyncFeedback({
        status: 'saved',
        text: `${actionName} gesichert`,
        timestamp: Date.now()
      });
      syncTimeoutRef.current = setTimeout(() => {
        setSyncFeedback(prev => prev.status === 'saved' ? { status: 'idle', text: '' } : prev);
      }, 2500);
      return Promise.resolve();
    }

    setSyncFeedback({
      status: 'uploading',
      text: `${actionName} wird gespeichert...`
    });

    if (cloudPromise) {
      // Add a safety timeout of 15 seconds to prevent hanging the UI forever
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 15000)
      );

      return Promise.race([cloudPromise, timeoutPromise])
        .then(() => {
          // Keep the "saved" state a bit longer for visual confirmation
          setSyncFeedback({
            status: 'saved',
            text: `${actionName} erfolgreich gespeichert ✓`,
            timestamp: Date.now()
          });
          syncTimeoutRef.current = setTimeout(() => {
            setSyncFeedback(prev => (prev.status === 'saved' || prev.status === 'uploading') ? { status: 'idle', text: '' } : prev);
          }, 600);
          return true;
        })
        .catch((err) => {
          const isTimeout = err.message === 'timeout';
          console.warn(isTimeout ? 'Sync timed out' : 'Sync failed:', err);
          
          setSyncFeedback({
            status: 'error',
            text: isTimeout 
              ? `Cloud-Verbindung langsam... (Timeout)` 
              : `Synchronisierung fehlgeschlagen.`
          });
          
          // Allow the user to dismiss the error after a few seconds
          syncTimeoutRef.current = setTimeout(() => {
            setSyncFeedback(prev => prev.status === 'error' ? { status: 'idle', text: '' } : prev);
          }, 5000);
          
          if (!isTimeout) throw err;
          return false;
        });
    }
    return Promise.resolve();
  }, [firebaseUser]);

  const isAdmin = useMemo(() => {
    if (firebaseUser?.email?.toLowerCase() === 'moritz.menet.bfsu@gmail.com') return true;
    const currentMember = activeUserId ? data.members[activeUserId] : null;
    return currentMember?.role === 'admin';
  }, [firebaseUser, activeUserId, data.members]);

  const activeUser = useMemo(() => activeUserId ? data.members[activeUserId] || null : null, [activeUserId, data.members]);

  const effectiveTheme = useMemo(() => {
    // 1. Prioritize active user's individual preference
    if (activeUser?.preferred_theme) return activeUser.preferred_theme;
    // 2. Fallback to household-level global setting
    if (data.settings.color_theme) return data.settings.color_theme;
    // 3. Fallback to local device state
    return colorTheme;
  }, [activeUser?.preferred_theme, data.settings.color_theme, colorTheme]);

  const recordSession = useCallback(async (user: User) => {
    try {
      // Small delay to ensure auth token is propagated to Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Firebase: Attempting to record session for', user.email, 'UID:', user.uid);
      // Get IP via public API
      const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const ipData = ipRes ? await ipRes.json() : { ip: 'unknown' };
      
      const userAgent = navigator.userAgent;
      let deviceType = 'Desktop';
      if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
      if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

      const session: SessionLog = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        user_id: user.uid,
        email: user.email || 'unknown',
        ip_address: ipData.ip,
        user_agent: userAgent,
        device_type: deviceType,
        timestamp: new Date().toISOString()
      };

      const sessionRef = doc(db, 'households', HOUSEHOLD_ID, 'sessions', session.id);
      await setDoc(sessionRef, session);
      console.log('Firebase: Session recorded successfully:', session.id);
    } catch (err) {
      console.error('Firebase: Session record failed:', err);
    }
  }, []);

  const blockUserByEmail = useCallback(async (email: string) => {
    if (!isAdmin) return;
    const nextBlocked = [...new Set([...blockedEmails, email.toLowerCase()])];
    const settingsRef = doc(db, 'households', HOUSEHOLD_ID);
    await setDoc(settingsRef, { blocked_emails: nextBlocked }, { merge: true });
  }, [isAdmin, blockedEmails]);

  const unblockUserByEmail = useCallback(async (email: string) => {
    if (!isAdmin) return;
    const nextBlocked = blockedEmails.filter(e => e !== email.toLowerCase());
    const settingsRef = doc(db, 'households', HOUSEHOLD_ID);
    await setDoc(settingsRef, { blocked_emails: nextBlocked }, { merge: true });
  }, [isAdmin, blockedEmails]);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem(COLOR_THEME_KEY, theme);
    
    if (activeUser) {
      // Individual theme: update the active user's preference
      const updatedMember = { ...activeUser, preferred_theme: theme };
      setData(prev => ({
        ...prev,
        members: { ...prev.members, [activeUser.id]: updatedMember }
      }));
      
      if (firebaseUser) {
        const cloudPromise = saveMemberToCloud(updatedMember);
        triggerSyncFeedback('Farb-Design geändert', cloudPromise);
      }
    } else {
      // If no user is active (e.g. initial setup), update global settings as a fallback
      const nextSettings = { ...data.settings, color_theme: theme };
      setData(prev => ({ ...prev, settings: nextSettings }));
      
      if (firebaseUser) {
        const cloudPromise = saveSettingsToCloud(nextSettings);
        triggerSyncFeedback('Farb-Design geändert', cloudPromise);
      }
    }
  }, [data.settings, firebaseUser, activeUser, triggerSyncFeedback]);

  useEffect(() => {
    applyColorTheme(effectiveTheme);
  }, [effectiveTheme]);

  const persistLocal = useCallback((newData: FamilyData) => {
    setData(newData);
    // Only persist to localStorage if NOT logged in to Firebase
    // User requested "direct cloud" and "not local"
    if (!auth.currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }
  }, []);

  const [syncRetryKey, setSyncRetryKey] = useState(0);

  const retrySync = useCallback(() => {
    setFirebaseError(null);
    setSyncStatus('connecting');
    setSyncRetryKey(k => k + 1);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsAuthResolving(true);
      console.log('Firebase: Auth state changed. User:', user?.email || 'none');
      
      // Explicit connection test for user feedback
      testFirestoreConnection();
      
      if (user) {
        try {
          await user.getIdToken();
          // Record session on login
          recordSession(user);
        } catch (e) {
          console.warn('Could not refresh auth token:', e);
        }
      }
      
      setFirebaseUser(user);
      setIsAuthResolving(false);
      
      if (!user) {
        setSyncStatus('offline');
        setFirebaseError(null);
        setIsAppLoaded(true);
      } else {
        setSyncStatus('connecting');
        setFirebaseError(null);
      }
    });
    return unsub;
  }, []);

  // Firestore Synchronizer
  useEffect(() => {
    if (!firebaseUser) return;

    setSyncStatus('connecting');
    setFirebaseError(null);
    let isCancelled = false;
    let loaded = { settings: false, members: false, tasks: false, logs: false };

    const checkDone = () => {
      if (!isCancelled && loaded.settings && loaded.members && loaded.tasks && loaded.logs) {
        setSyncStatus('synced');
        setFirebaseError(null);
        setIsAppLoaded(true);
      }
    };

    // 1. Household / Settings
    const unsubHousehold = onSnapshot(doc(db, 'households', HOUSEHOLD_ID), async (snap) => {
      if (isCancelled) return;
      try {
        if (!snap.exists()) {
          if (firebaseUser.email?.toLowerCase() === 'moritz.menet.bfsu@gmail.com') {
            await seedAllDataToCloud(data);
          }
        } else {
          const cloudData = snap.data();
          const cloudSettings = cloudData as FamilySettings;
          const cloudBlocked = (cloudData as any).blocked_emails || [];
          setBlockedEmails(cloudBlocked);

          // Security check: if current user is blocked, sign them out
          if (firebaseUser.email && cloudBlocked.includes(firebaseUser.email.toLowerCase())) {
            console.warn('User is blocked. Signing out...');
            await signOut(auth);
            return;
          }

          setData(prev => {
            const next = { 
              ...prev, 
              settings: { 
                ...prev.settings, 
                ...cloudSettings,
                categories: Array.isArray(cloudSettings.categories) && cloudSettings.categories.length > 0 
                  ? cloudSettings.categories 
                  : prev.settings.categories
              } 
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      } catch (err: any) {
        console.warn('Household sync notice:', err);
      }
      loaded.settings = true;
      checkDone();
    }, (err) => {
      console.warn('Sync notice (Settings):', err);
      loaded.settings = true;
      checkDone();
    });

    // 2. Members
    const unsubMembers = onSnapshot(collection(db, 'households', HOUSEHOLD_ID, 'members'), (snap) => {
      if (isCancelled) return;
      const membersMap: Record<string, FamilyMember> = {};
      snap.forEach(d => { 
        const m = d.data() as FamilyMember;
        membersMap[m.id || d.id] = { ...m, id: m.id || d.id }; 
      });

      if (Object.keys(membersMap).length > 0) {
        setData(prev => {
          const next = { ...prev, members: membersMap };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });

        // Ensure activeUserId points to a valid member
        setActiveUserIdState(currentId => {
          if (currentId && membersMap[currentId]) return currentId;
          const chosen = Object.keys(membersMap)[0] || null;
          if (chosen) {
            localStorage.setItem(ACTIVE_USER_KEY, chosen);
            return chosen;
          } else {
            localStorage.removeItem(ACTIVE_USER_KEY);
            return null;
          }
        });
      } else {
        // Empty cloud members - do not inject fake members
        setData(prev => {
          const next = { ...prev, members: {} };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
        setActiveUserIdState(null);
        localStorage.removeItem(ACTIVE_USER_KEY);
      }
      loaded.members = true;
      checkDone();
    }, (err) => {
      console.warn('Sync notice (Members):', err);
      loaded.members = true;
      checkDone();
    });

    // 3. Tasks
    const unsubTasks = onSnapshot(collection(db, 'households', HOUSEHOLD_ID, 'tasks'), (snap) => {
      if (isCancelled) return;
      const tasksMap: Record<string, TaskItem> = {};
      snap.forEach(d => { 
        const t = d.data() as TaskItem;
        tasksMap[t.id || d.id] = { ...t, id: t.id || d.id }; 
      });

      setData(prev => {
        const next = { ...prev, tasks: tasksMap };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      loaded.tasks = true;
      checkDone();
    }, (err) => {
      console.warn('Sync notice (Tasks):', err);
      loaded.tasks = true;
      checkDone();
    });

    // 4. Logs
    const unsubLogs = onSnapshot(collection(db, 'households', HOUSEHOLD_ID, 'logs'), (snap) => {
      if (isCancelled) return;
      const logsList: ChoreLog[] = [];
      snap.forEach(d => { 
        const l = d.data() as ChoreLog;
        logsList.push({ ...l, log_id: l.log_id || d.id }); 
      });
      setData(prev => {
        const sorted = logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const next = { ...prev, logs: sorted };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      loaded.logs = true;
      checkDone();
    }, (err) => {
      console.warn('Sync notice (Logs):', err);
      loaded.logs = true;
      checkDone();
    });

    // 5. Sessions (Admin only)
    let unsubSessions = () => {};
    if (isAdmin) {
      console.log('Firebase: Setting up sessions listener (Admin access granted)');
      unsubSessions = onSnapshot(collection(db, 'households', HOUSEHOLD_ID, 'sessions'), (snap) => {
        if (isCancelled) return;
        const sessList: SessionLog[] = [];
        snap.forEach(d => sessList.push(d.data() as SessionLog));
        console.log(`Firebase: Loaded ${sessList.length} sessions`);
        setSessions(sessList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, (err) => {
        console.warn('Sessions sync notice:', err);
      });
    }

    // Safety fallback: Never leave user stuck on connection screen
    const safetyTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsAppLoaded(true);
        setSyncStatus(prev => prev === 'connecting' ? 'synced' : prev);
      }
    }, 1200); // Reduced from 2500ms for faster feel

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
      unsubHousehold();
      unsubMembers();
      unsubTasks();
      unsubLogs();
      unsubSessions();
    };
  }, [firebaseUser, syncRetryKey, isAdmin]);

  // CRUD Implementations (preserving original logic but calling cloud service)
  
  const logChore = useCallback(async (taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string): Promise<number> => {
    if (!activeUser) return 0;
    const task = data.tasks[taskId];
    if (!task) return 0;

    const points = calculatePoints(task.base_points, stars, data.settings);
    const now = new Date().toISOString();
    const newLog: ChoreLog = {
      log_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      task_id: taskId,
      user_id: activeUser.id,
      stars,
      points_awarded: points,
      actual_duration: actualDuration,
      timestamp: now,
      notes: notes?.trim() || undefined
    };

    const updatedTask = { ...task, last_done: now };
    const updatedMember = { ...data.members[activeUser.id], total_points: (data.members[activeUser.id].total_points || 0) + points };

    if (firebaseUser) {
      // WAIT for cloud success before returning
      // We don't call persistLocal here because onSnapshot will handle it
      const p = saveChoreLogToCloud(newLog, updatedTask, updatedMember);
      await triggerSyncFeedback('Aufgabe erledigt', p);
    } else {
      // Offline mode: update local immediately
      persistLocal({
        ...data,
        tasks: { ...data.tasks, [taskId]: updatedTask },
        members: { ...data.members, [activeUser.id]: updatedMember },
        logs: [newLog, ...data.logs]
      });
      triggerSyncFeedback('Aufgabe erledigt');
    }

    return points;
  }, [activeUser, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const updateLog = useCallback(async (
    logId: string, 
    updates: {
      task_id?: string;
      user_id?: string;
      stars?: 1 | 2 | 3;
      actual_duration?: number;
      notes?: string;
      timestamp?: string;
    }
  ): Promise<boolean> => {
    const oldLog = data.logs.find(l => l.log_id === logId);
    if (!oldLog) return false;

    const canEdit = isAdmin || (activeUser && activeUser.id === oldLog.user_id);
    if (!canEdit) return false;

    const targetTaskId = updates.task_id || oldLog.task_id;
    const targetUserId = updates.user_id || oldLog.user_id;
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
      points_awarded: newPointsAwarded,
      actual_duration: targetActualDuration,
      timestamp: targetTimestamp,
      notes: targetNotes
    };

    const pointDifference = newPointsAwarded - oldLog.points_awarded;
    const currentMember = data.members[targetUserId];
    
    const updatedMembers = { ...data.members };
    if (currentMember) {
      updatedMembers[targetUserId] = {
        ...currentMember,
        total_points: (currentMember.total_points || 0) + pointDifference
      };
    }

    const updatedLogs = data.logs.map(l => l.log_id === logId ? updatedLog : l);

    if (firebaseUser) {
      const p = saveChoreLogToCloud(updatedLog, data.tasks[targetTaskId], updatedMembers[targetUserId]);
      await triggerSyncFeedback('Eintrag aktualisiert', p);
    } else {
      persistLocal({
        ...data,
        members: updatedMembers,
        logs: updatedLogs
      });
      triggerSyncFeedback('Eintrag aktualisiert');
    }

    return true; 
  }, [isAdmin, activeUser, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const deleteLog = useCallback(async (logId: string) => {
    const filtered = data.logs.filter(l => l.log_id !== logId);
    if (firebaseUser) {
      const p = deleteChoreLogFromCloud(logId);
      await triggerSyncFeedback('Eintrag gelöscht', p);
    } else {
      persistLocal({ ...data, logs: filtered });
      triggerSyncFeedback('Eintrag gelöscht');
    }
    return true;
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const createTask = useCallback(async (task: any) => {
    const id = `task_${Date.now()}`;
    const newTask = { ...task, id, created_by: activeUser?.name || 'Admin', last_done: null };
    if (firebaseUser) {
      const p = saveTaskToCloud(newTask);
      await triggerSyncFeedback('Aufgabe erstellt', p);
    } else {
      persistLocal({ ...data, tasks: { ...data.tasks, [id]: newTask } });
      triggerSyncFeedback('Aufgabe erstellt');
    }
  }, [data, activeUser, firebaseUser, persistLocal, triggerSyncFeedback]);

  const updateTask = useCallback(async (id: string, updates: any) => {
    const updated = { ...data.tasks[id], ...updates };
    if (firebaseUser) {
      const p = saveTaskToCloud(updated);
      await triggerSyncFeedback('Aufgabe geändert', p);
    } else {
      persistLocal({ ...data, tasks: { ...data.tasks, [id]: updated } });
      triggerSyncFeedback('Aufgabe geändert');
    }
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const deleteTask = useCallback(async (id: string) => {
    const { [id]: _, ...remaining } = data.tasks;
    if (firebaseUser) {
      const p = deleteTaskFromCloud(id);
      await triggerSyncFeedback('Aufgabe gelöscht', p);
    } else {
      persistLocal({ ...data, tasks: remaining });
      triggerSyncFeedback('Aufgabe gelöscht');
    }
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const addMember = useCallback(async (name: string, avatarColor: string, role: UserRole, weeklyTarget = 50, pinCode?: string): Promise<FamilyMember> => {
    const id = `user_${Date.now()}`;
    const newMember: FamilyMember = { 
      id, 
      name: name.trim(), 
      role, 
      avatar_color: avatarColor, 
      total_points: 0, 
      weekly_target: weeklyTarget,
      pin_code: pinCode
    };
    if (firebaseUser) {
      const p = saveMemberToCloud(newMember);
      await triggerSyncFeedback('Profil erstellt', p);
    } else {
      persistLocal({ ...data, members: { ...data.members, [id]: newMember } });
      triggerSyncFeedback('Profil erstellt');
    }
    return newMember;
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const initializeAdminProfile = useCallback(async (name: string, avatarColor = '#4F46E5', _withDefaultTasks = false): Promise<FamilyMember> => {
    const id = `user_${Date.now()}`;
    const adminMember: FamilyMember = {
      id,
      name: name.trim() || 'Admin',
      role: 'admin',
      avatar_color: avatarColor,
      total_points: 0,
      weekly_target: data.settings.default_weekly_target || 50
    };
    
    const nextData: FamilyData = {
      ...data,
      members: { ...data.members, [id]: adminMember }
    };

    if (firebaseUser) {
      const p = seedAllDataToCloud(nextData);
      await triggerSyncFeedback('Profil eingerichtet', p);
    } else {
      persistLocal(nextData);
      triggerSyncFeedback('Profil eingerichtet');
    }
    
    setActiveUserIdState(id);
    localStorage.setItem(ACTIVE_USER_KEY, id);

    return adminMember;
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const updateMember = useCallback(async (id: string, updates: any) => {
    const updated = { ...data.members[id], ...updates };
    if (firebaseUser) {
      const p = saveMemberToCloud(updated);
      await triggerSyncFeedback('Profil aktualisiert', p);
    } else {
      persistLocal({ ...data, members: { ...data.members, [id]: updated } });
      triggerSyncFeedback('Profil aktualisiert');
    }
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const deleteMember = useCallback(async (id: string) => {
    const { [id]: _, ...remaining } = data.members;
    if (firebaseUser) {
      const p = deleteMemberFromCloud(id);
      await triggerSyncFeedback('Profil gelöscht', p);
    } else {
      persistLocal({ ...data, members: remaining });
      triggerSyncFeedback('Profil gelöscht');
    }
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  // Auth Actions
  const loginWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('connecting');
      setFirebaseError(null);
      await signInWithPopup(auth, googleProvider);
      console.log('Firebase: Login process completed.');
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncStatus('error');
      const msg = err.code === 'auth/popup-blocked' 
        ? 'Login-Fenster wurde blockiert. Bitte Popups erlauben.'
        : err.message || 'Login fehlgeschlagen';
      setFirebaseError(msg);
    }
  }, []);

  const logoutFirebase = useCallback(async () => {
    // Preserve activeUserId in localStorage even on logout 
    // so the profile stays selected when switching accounts
    await signOut(auth);
    setSyncStatus('offline');
  }, []);

  const uploadAllToCloud = useCallback(async () => {
    if (firebaseUser) {
      setSyncStatus('connecting');
      const p = seedAllDataToCloud(data);
      triggerSyncFeedback('Alle Daten', p);
      await p;
      setSyncStatus('synced');
    }
  }, [firebaseUser, data, triggerSyncFeedback]);

  const resetFirebaseCompletely = useCallback(async () => {
    if (!firebaseUser) {
      throw new Error('Du musst mit Google/Firebase angemeldet sein, um die Cloud zurückzusetzen.');
    }
    setSyncStatus('connecting');
    setFirebaseError(null);

    const freshData: FamilyData = {
      settings: {
        household_name: 'Unser Haushalt',
        default_weekly_target: 50,
        categories: ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
        last_reset_date: new Date().toISOString(),
        color_theme: 'indigo',
        star_multiplier_1: 50,
        star_multiplier_2: 75,
        star_multiplier_3: 100,
        rollover_surplus_factor: 100,
        rollover_deficit_factor: 100,
        rollover_min_target: 10,
        rollover_max_target: 200,
        week_start_day: 'monday',
        allowed_emails: []
      },
      members: {},
      tasks: {},
      logs: []
    };

    const p = resetAndRebuildCloudData(freshData);
    triggerSyncFeedback('Haushalt leeren & zurücksetzen', p);
    await p;
    persistLocal(freshData);
    setActiveUserIdState(null);
    localStorage.removeItem(ACTIVE_USER_KEY);
    setSyncStatus('synced');
  }, [firebaseUser, persistLocal, triggerSyncFeedback]);

  // Helpers
  const setActiveUserId = useCallback((id: string | null) => {
    setActiveUserIdState(id);
    if (id) localStorage.setItem(ACTIVE_USER_KEY, id);
    else localStorage.removeItem(ACTIVE_USER_KEY);
  }, []);

  return (
    <AppContext.Provider value={{
      isAppLoaded, isAuthResolving, data, activeUser, isAdmin, theme, toggleTheme,
      colorTheme, effectiveTheme, setColorTheme,
      sessions, recordSession, blockUserByEmail, unblockUserByEmail, blockedEmails,
      setActiveUserId, firebaseUser, syncStatus, syncFeedback, firebaseError,
      loginWithGoogle, logoutFirebase, uploadAllToCloud, resetFirebaseCompletely, retrySync,
      logChore, updateLog, deleteLog, createTask, updateTask, deleteTask,
      addCategory: (c) => {
        if (data.settings.categories.includes(c)) return false;
        const next = { ...data.settings, categories: [...data.settings.categories, c] };
        persistLocal({ ...data, settings: next });
        if (firebaseUser) {
          triggerSyncFeedback('Kategorie erstellt', saveSettingsToCloud(next));
        } else {
          triggerSyncFeedback('Kategorie erstellt');
        }
        return true;
      },
      renameCategory: (old, next) => {
        const categories = data.settings.categories.map(c => c === old ? next : c);
        const nextSettings = { ...data.settings, categories };
        persistLocal({ ...data, settings: nextSettings });
        if (firebaseUser) {
          triggerSyncFeedback('Kategorie umbenannt', saveSettingsToCloud(nextSettings));
        } else {
          triggerSyncFeedback('Kategorie umbenannt');
        }
        return true;
      },
      deleteCategory: (c) => {
        const categories = data.settings.categories.filter(cat => cat !== c);
        const nextSettings = { ...data.settings, categories };
        persistLocal({ ...data, settings: nextSettings });
        if (firebaseUser) {
          triggerSyncFeedback('Kategorie gelöscht', saveSettingsToCloud(nextSettings));
        } else {
          triggerSyncFeedback('Kategorie gelöscht');
        }
        return true;
      },
      addMember, initializeAdminProfile, updateMember, deleteMember,
      updateProfile: (u) => activeUserId && updateMember(activeUserId, u),
      isTutorialOpen, openTutorial: () => setIsTutorialOpen(true),
      closeTutorial: () => setIsTutorialOpen(false),
      completeTutorial: () => {
        setIsTutorialOpen(false);
        if (activeUserId) updateMember(activeUserId, { has_seen_tutorial: true });
      },
      updateSettings: (u) => {
        const next = { ...data.settings, ...u };
        persistLocal({ ...data, settings: next });
        if (firebaseUser) {
          triggerSyncFeedback('Einstellungen', saveSettingsToCloud(next));
        } else {
          triggerSyncFeedback('Einstellungen');
        }
      },
      updateDefaultWeeklyTarget: (t) => {
        const next = { ...data.settings, default_weekly_target: t };
        persistLocal({ ...data, settings: next });
        if (firebaseUser) {
          triggerSyncFeedback('Wochenziel', saveSettingsToCloud(next));
        } else {
          triggerSyncFeedback('Wochenziel');
        }
      },
      getWeeklyRollOverPreview: () => {
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
      },
      executeWeeklyReset: () => {
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
          updatedMembers[member.id] = { ...member, weekly_target: newTarget };
        });

        const nextSettings: FamilySettings = {
          ...data.settings,
          last_reset_date: new Date().toISOString()
        };

        persistLocal({
          ...data,
          settings: nextSettings,
          members: updatedMembers
        });

        if (firebaseUser) {
          const p = Promise.all([
            saveSettingsToCloud(nextSettings),
            ...Object.values(updatedMembers).map(m => saveMemberToCloud(m))
          ]);
          triggerSyncFeedback('Wochen-Reset', p);
        } else {
          triggerSyncFeedback('Wochen-Reset');
        }
      },
      clearAllData: async () => {
        persistLocal(INITIAL_FAMILY_DATA);
        setActiveUserIdState(null);
        localStorage.removeItem(ACTIVE_USER_KEY);
        if (firebaseUser) {
          const p = clearAllCloudData();
          triggerSyncFeedback('Daten gelöscht', p);
          await p;
        } else {
          triggerSyncFeedback('Daten gelöscht');
        }
      },
      resetToDemoData: async () => {
        persistLocal(INITIAL_FAMILY_DATA);
        setActiveUserIdState(null);
        localStorage.removeItem(ACTIVE_USER_KEY);
        if (firebaseUser) {
          const p = clearAllCloudData();
          await triggerSyncFeedback('Haushalt geleert', p);
          await p;
        } else {
          triggerSyncFeedback('Haushalt geleert');
        }
      },
      exportDataJSON: () => JSON.stringify(data),
      importDataJSON: (j) => {
        try {
          const p = JSON.parse(j);
          if (p.members) { persistLocal(p); return true; }
        } catch { /* */ }
        return false;
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
};
