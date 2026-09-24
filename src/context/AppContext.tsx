import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ChoreLog, ColorTheme, FamilyData, FamilyMember, FamilySettings, PinnwandNote, PinnwandPoll, PostItColor, SessionLog, TaskItem, UserRole, WeeklyRollOverPreview } from '../types';
import { INITIAL_FAMILY_DATA, DEMO_FAMILY_DATA, DEFAULT_HOUSEHOLD_TASKS, DEFAULT_PINNWAND_NOTES } from '../data/initialData';
import { calculatePoints, calculateRollOverTarget, getMemberCyclePoints } from '../utils';
import { applyColorTheme } from '../theme';
import { 
  db, 
  auth, 
  googleProvider, 
  appleProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
  clearAllCloudData,
  savePinnwandNoteToCloud,
  deletePinnwandNoteFromCloud
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
  loginWithApple: () => Promise<void>;
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
  fishTask: (taskId: string, untilDate: string) => Promise<void>;
  unfishTask: (taskId: string) => Promise<void>;

  // Category CRUD (Admin)
  addCategory: (category: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (category: string) => boolean;

  // Member CRUD (Admin & Account editing)
  addMember: (name: string, avatarColor: string, role: UserRole, weeklyTarget?: number, pinCode?: string) => Promise<FamilyMember>;
  initializeAdminProfile: (name: string, avatarColor?: string, withDefaultTasks?: boolean) => Promise<FamilyMember>;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  updateProfile: (updates: Partial<FamilyMember>) => void;
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

  // Pinnwand (Bulletin Board with Threads, Red String, Polls, Reactions)
  pinnwandNotes: PinnwandNote[];
  createPinnwandNote: (note: {
    rootId?: string;
    parentId?: string | null;
    depth?: number;
    title?: string;
    content: string;
    color: PostItColor;
    category?: string;
    poll?: PinnwandPoll;
    position?: { x: number; y: number };
    rotation?: number;
  }) => Promise<PinnwandNote>;
  updatePinnwandNote: (noteId: string, updates: Partial<PinnwandNote>) => Promise<boolean>;
  deletePinnwandNote: (noteId: string) => Promise<boolean>;
  votePinnwandPoll: (noteId: string, optionId: string) => Promise<boolean>;
  togglePinnwandReaction: (noteId: string, emoji: string) => Promise<boolean>;
  updateNotePosition: (noteId: string, position: { x: number; y: number }) => void;
  autoArrangePinnwand: () => void;
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
          if (parsed && parsed.members && parsed.tasks) {
            if (!parsed.pinnwand || Object.keys(parsed.pinnwand).length === 0) {
              parsed.pinnwand = { ...DEFAULT_PINNWAND_NOTES };
            }
            return parsed;
          }
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
      await new Promise(resolve => setTimeout(resolve, 600));
      
      console.log('Firebase: Attempting to record session for', user.email, 'UID:', user.uid);
      // Get IP via public API with timeout fallback
      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && typeof ipData.ip === 'string') ip = ipData.ip;
        }
      } catch {
        // IP lookup optional
      }
      
      const userAgent = navigator.userAgent;
      let deviceType = 'Desktop';
      if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
      if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

      const session: SessionLog = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        user_id: user.uid,
        email: user.email || 'unknown',
        ip_address: ip,
        user_agent: userAgent,
        device_type: deviceType,
        timestamp: new Date().toISOString()
      };

      const sessionRef = doc(db, 'sessions', session.id);
      await setDoc(sessionRef, session);
      console.log('Firebase: Session recorded successfully:', session.id);
    } catch (err) {
      console.warn('Firebase: Session record notice (non-fatal):', err);
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
    // Process redirect sign-in results if the page was redirected (e.g., mobile or Family Link flow)
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log('Firebase: Successfully authenticated via redirect:', res.user.email || res.user.uid);
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/credential-already-in-use') {
          console.warn('Firebase: Redirect auth resolution note:', err);
        }
      });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsAuthResolving(true);
      console.log('Firebase: Auth state changed. User:', user?.email || user?.uid || 'none');
      
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
  }, [recordSession]);

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

    // 5. Pinnwand notes
    const unsubPinnwand = onSnapshot(collection(db, 'households', HOUSEHOLD_ID, 'pinnwand'), (snap) => {
      if (isCancelled) return;
      const notesMap: Record<string, PinnwandNote> = {};
      snap.forEach(d => { 
        const n = d.data() as PinnwandNote;
        notesMap[n.id || d.id] = { ...n, id: n.id || d.id }; 
      });

      if (Object.keys(notesMap).length > 0) {
        setData(prev => {
          const next = { ...prev, pinnwand: notesMap };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    }, (err) => {
      console.warn('Sync notice (Pinnwand):', err);
    });

    // 6. Sessions (Admin only)
    let unsubSessions = () => {};
    if (isAdmin) {
      console.log('Firebase: Setting up sessions listener (Admin access granted)');
      unsubSessions = onSnapshot(collection(db, 'sessions'), (snap) => {
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
      unsubPinnwand();
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
    const newTask = { ...task, id, created_by: activeUser?.name || 'Familie', last_done: null };
    setData(prev => {
      const nextTasks = { ...prev.tasks, [id]: newTask };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (firebaseUser) {
      try {
        const p = saveTaskToCloud(newTask);
        await triggerSyncFeedback('Aufgabe erstellt', p);
      } catch (err) {
        console.warn('Task create notice:', err);
      }
    } else {
      triggerSyncFeedback('Aufgabe erstellt');
    }
  }, [activeUser, firebaseUser, triggerSyncFeedback]);

  const updateTask = useCallback(async (id: string, updates: any) => {
    const currentTask = data.tasks[id];
    if (!currentTask) return;
    const updated = { ...currentTask, ...updates };
    setData(prev => {
      const nextTasks = { ...prev.tasks, [id]: updated };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (firebaseUser) {
      try {
        const p = saveTaskToCloud(updated);
        await triggerSyncFeedback('Aufgabe geändert', p);
      } catch (err) {
        console.warn('Task update notice:', err);
      }
    } else {
      triggerSyncFeedback('Aufgabe geändert');
    }
  }, [data.tasks, firebaseUser, triggerSyncFeedback]);

  const deleteTask = useCallback(async (id: string) => {
    setData(prev => {
      const { [id]: _, ...remaining } = prev.tasks;
      const next = { ...prev, tasks: remaining };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (firebaseUser) {
      try {
        const p = deleteTaskFromCloud(id);
        await triggerSyncFeedback('Aufgabe gelöscht', p);
      } catch (err) {
        console.warn('Task delete notice:', err);
      }
    } else {
      triggerSyncFeedback('Aufgabe gelöscht');
    }
  }, [firebaseUser, triggerSyncFeedback]);

  const fishTask = useCallback(async (taskId: string, untilDate: string) => {
    if (!activeUser) return;
    const currentTask = data.tasks[taskId];
    if (!currentTask) return;
    
    const updated = { 
      ...currentTask, 
      fished_by: activeUser.id, 
      fished_until: untilDate 
    };
    
    setData(prev => {
      const nextTasks = { ...prev.tasks, [taskId]: updated };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    
    if (firebaseUser) {
      try {
        const p = saveTaskToCloud(updated);
        await triggerSyncFeedback('Aufgabe gefischt', p);
      } catch (err) {
        console.warn('Task fish notice:', err);
      }
    } else {
      triggerSyncFeedback('Aufgabe gefischt');
    }
  }, [activeUser, data.tasks, firebaseUser, triggerSyncFeedback]);

  const unfishTask = useCallback(async (taskId: string) => {
    const currentTask = data.tasks[taskId];
    if (!currentTask) return;
    
    const updated = { 
      ...currentTask, 
      fished_by: null, 
      fished_until: null 
    };
    
    setData(prev => {
      const nextTasks = { ...prev.tasks, [taskId]: updated };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    
    if (firebaseUser) {
      try {
        const p = saveTaskToCloud(updated);
        await triggerSyncFeedback('Reservierung aufgehoben', p);
      } catch (err) {
        console.warn('Task unfish notice:', err);
      }
    } else {
      triggerSyncFeedback('Reservierung aufgehoben');
    }
  }, [data.tasks, firebaseUser, triggerSyncFeedback]);

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
    setData(prev => {
      const nextMembers = { ...prev.members, [id]: newMember };
      const next = { ...prev, members: nextMembers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (firebaseUser) {
      try {
        const p = saveMemberToCloud(newMember);
        await triggerSyncFeedback('Profil erstellt', p);
      } catch (err) {
        console.warn('Add member notice:', err);
      }
    } else {
      triggerSyncFeedback('Profil erstellt');
    }
    return newMember;
  }, [firebaseUser, triggerSyncFeedback]);

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
    const currentMember = data.members[id];
    if (!currentMember) return;
    const updated = { ...currentMember, ...updates };
    setData(prev => {
      const nextMembers = { ...prev.members, [id]: updated };
      const next = { ...prev, members: nextMembers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (firebaseUser) {
      try {
        const p = saveMemberToCloud(updated);
        await triggerSyncFeedback('Profil aktualisiert', p);
      } catch (err) {
        console.warn('Update member notice:', err);
      }
    } else {
      triggerSyncFeedback('Profil aktualisiert');
    }
  }, [data.members, firebaseUser, triggerSyncFeedback]);

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
      console.log('Firebase: Google login process completed.');
    } catch (err: any) {
      console.error('Google login error:', err);
      // In Google Family Link, when a parent confirms, the popup is often closed automatically
      // or closed by the user right after consent. If auth resolution is in progress or about to complete,
      // do not lock the UI in an error state!
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setTimeout(() => {
          if (!auth.currentUser) {
            setSyncStatus(firebaseUser ? 'synced' : 'offline');
          }
        }, 1200);
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        try {
          console.log('Popup blocked, falling back to signInWithRedirect...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr) {
          console.warn('Redirect fallback error:', redirErr);
        }
        setSyncStatus('error');
        setFirebaseError('Login-Fenster wurde blockiert. Bitte Popups im Browser erlauben oder Seite neu laden.');
        return;
      }
      setSyncStatus('error');
      setFirebaseError(err.message || 'Google-Anmeldung fehlgeschlagen.');
    }
  }, [firebaseUser]);

  const loginWithApple = useCallback(async () => {
    try {
      setSyncStatus('connecting');
      setFirebaseError(null);
      await signInWithPopup(auth, appleProvider);
      console.log('Firebase: Apple login process completed.');
    } catch (err: any) {
      console.error('Apple login error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setTimeout(() => {
          if (!auth.currentUser) {
            setSyncStatus(firebaseUser ? 'synced' : 'offline');
          }
        }, 1200);
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        try {
          console.log('Popup blocked, falling back to signInWithRedirect for Apple...');
          await signInWithRedirect(auth, appleProvider);
          return;
        } catch (redirErr) {
          console.warn('Redirect fallback error for Apple:', redirErr);
        }
        setSyncStatus('error');
        setFirebaseError('Login-Fenster wurde blockiert. Bitte Popups im Browser erlauben.');
        return;
      }
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setSyncStatus('error');
        setFirebaseError('Apple Sign-In ist in der Firebase Console noch nicht aktiv. Bitte in den Auth-Providern aktivieren.');
        return;
      }
      setSyncStatus('error');
      setFirebaseError(err.message || 'Apple-Anmeldung fehlgeschlagen.');
    }
  }, [firebaseUser]);

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

  // Pinnwand (Bulletin Board with Threads, Red String, Polls, Reactions)
  const pinnwandNotes = useMemo(() => {
    return Object.values(data.pinnwand || {}).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [data.pinnwand]);

  const createPinnwandNote = useCallback(async (
    noteInput: {
      rootId?: string;
      parentId?: string | null;
      depth?: number;
      title?: string;
      content: string;
      color: PostItColor;
      category?: string;
      poll?: PinnwandPoll;
      position?: { x: number; y: number };
      rotation?: number;
    }
  ): Promise<PinnwandNote> => {
    const currentMember = activeUser || {
      id: 'member_initial',
      name: 'Familienmitglied',
      avatar_color: '#4F46E5',
      role: 'member' as UserRole
    };

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const rootId = noteInput.rootId || (noteInput.parentId ? (data.pinnwand?.[noteInput.parentId]?.rootId || noteInput.parentId) : noteId);
    const parentDepth = noteInput.parentId ? (data.pinnwand?.[noteInput.parentId]?.depth ?? 0) : -1;
    const depth = noteInput.depth ?? (parentDepth + 1);

    // Calculate smart position if not given
    let pos = noteInput.position;
    if (!pos) {
      if (noteInput.parentId && data.pinnwand?.[noteInput.parentId]?.position) {
        const parentPos = data.pinnwand[noteInput.parentId].position!;
        const existingReplies = Object.values(data.pinnwand || {}).filter(n => n.parentId === noteInput.parentId);
        const replyIndex = existingReplies.length;
        pos = {
          x: parentPos.x + 300,
          y: parentPos.y + (replyIndex * 210) + (replyIndex % 2 === 0 ? 10 : -10)
        };
      } else {
        const rootNotes = Object.values(data.pinnwand || {}).filter(n => !n.parentId);
        const rootIndex = rootNotes.length;
        const col = rootIndex % 3;
        const row = Math.floor(rootIndex / 3);
        pos = {
          x: 60 + (col * 360),
          y: 70 + (row * 420)
        };
      }
    }

    const rotation = typeof noteInput.rotation === 'number' 
      ? noteInput.rotation 
      : (Math.random() * 3.6 - 1.8);

    const newNote: PinnwandNote = {
      id: noteId,
      rootId,
      parentId: noteInput.parentId || null,
      depth,
      title: noteInput.title?.trim() || undefined,
      content: noteInput.content.trim(),
      color: noteInput.color || 'yellow',
      category: noteInput.category || 'Allgemein',
      authorId: currentMember.id,
      authorName: currentMember.name,
      authorAvatarColor: currentMember.avatar_color,
      createdAt: new Date().toISOString(),
      reactions: {},
      poll: noteInput.poll,
      position: pos,
      rotation: Number(rotation.toFixed(1))
    };

    const nextPinnwand = { ...(data.pinnwand || {}), [noteId]: newNote };
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      const p = savePinnwandNoteToCloud(newNote);
      triggerSyncFeedback(newNote.parentId ? 'Antwort angeheftet' : 'Neues Thema angeheftet', p);
    } else {
      triggerSyncFeedback(newNote.parentId ? 'Antwort angeheftet' : 'Neues Thema angeheftet');
    }

    return newNote;
  }, [activeUser, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const updatePinnwandNote = useCallback(async (noteId: string, updates: Partial<PinnwandNote>): Promise<boolean> => {
    const existing = data.pinnwand?.[noteId];
    if (!existing) return false;

    const updatedNote: PinnwandNote = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const nextPinnwand = { ...(data.pinnwand || {}), [noteId]: updatedNote };
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      const p = savePinnwandNoteToCloud(updatedNote);
      triggerSyncFeedback('Post-it aktualisiert', p);
    } else {
      triggerSyncFeedback('Post-it aktualisiert');
    }

    return true;
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const deletePinnwandNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!data.pinnwand?.[noteId]) return false;

    const notesToDelete = new Set<string>([noteId]);
    const findChildren = (pid: string) => {
      Object.values(data.pinnwand || {}).forEach(n => {
        if (n.parentId === pid) {
          notesToDelete.add(n.id);
          findChildren(n.id);
        }
      });
    };
    findChildren(noteId);

    const nextPinnwand = { ...(data.pinnwand || {}) };
    notesToDelete.forEach(id => delete nextPinnwand[id]);
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      const p = Promise.all(Array.from(notesToDelete).map(id => deletePinnwandNoteFromCloud(id)));
      triggerSyncFeedback('Post-it entfernt', p);
    } else {
      triggerSyncFeedback('Post-it entfernt');
    }

    return true;
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const votePinnwandPoll = useCallback(async (noteId: string, optionId: string): Promise<boolean> => {
    const note = data.pinnwand?.[noteId];
    if (!note || !note.poll || note.poll.closed) return false;
    const voterId = activeUser?.id || 'guest_voter';
    const poll = note.poll;
    const allowMultiple = Boolean(poll.allowMultiple);

    const updatedOptions = poll.options.map(opt => {
      const hasVoted = opt.voterIds.includes(voterId);
      if (opt.id === optionId) {
        return {
          ...opt,
          voterIds: hasVoted ? opt.voterIds.filter(id => id !== voterId) : [...opt.voterIds, voterId]
        };
      } else if (!allowMultiple) {
        return {
          ...opt,
          voterIds: opt.voterIds.filter(id => id !== voterId)
        };
      }
      return opt;
    });

    const updatedNote: PinnwandNote = {
      ...note,
      poll: {
        ...poll,
        options: updatedOptions
      },
      updatedAt: new Date().toISOString()
    };

    const nextPinnwand = { ...(data.pinnwand || {}), [noteId]: updatedNote };
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      const p = savePinnwandNoteToCloud(updatedNote);
      triggerSyncFeedback('Stimme gezählt', p);
    } else {
      triggerSyncFeedback('Stimme gezählt');
    }

    return true;
  }, [activeUser, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const togglePinnwandReaction = useCallback(async (noteId: string, emoji: string): Promise<boolean> => {
    const note = data.pinnwand?.[noteId];
    if (!note) return false;
    const userId = activeUser?.id || 'guest_voter';

    const currentReactions = { ...(note.reactions || {}) };
    const currentList = currentReactions[emoji] || [];
    const hasReacted = currentList.includes(userId);

    if (hasReacted) {
      const filtered = currentList.filter(id => id !== userId);
      if (filtered.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = filtered;
      }
    } else {
      currentReactions[emoji] = [...currentList, userId];
    }

    const updatedNote: PinnwandNote = {
      ...note,
      reactions: currentReactions,
      updatedAt: new Date().toISOString()
    };

    const nextPinnwand = { ...(data.pinnwand || {}), [noteId]: updatedNote };
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      const p = savePinnwandNoteToCloud(updatedNote);
      triggerSyncFeedback('Reaktion aktualisiert', p);
    } else {
      triggerSyncFeedback('Reaktion aktualisiert');
    }

    return true;
  }, [activeUser, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  const updateNotePosition = useCallback((noteId: string, position: { x: number; y: number }) => {
    const note = data.pinnwand?.[noteId];
    if (!note) return;

    const updatedNote: PinnwandNote = {
      ...note,
      position
    };

    const nextPinnwand = { ...(data.pinnwand || {}), [noteId]: updatedNote };
    persistLocal({ ...data, pinnwand: nextPinnwand });

    if (firebaseUser) {
      savePinnwandNoteToCloud(updatedNote).catch(console.warn);
    }
  }, [data, firebaseUser, persistLocal]);

  const autoArrangePinnwand = useCallback(() => {
    const allNotes = Object.values(data.pinnwand || {});
    if (allNotes.length === 0) return;

    const roots = allNotes.filter(n => !n.parentId);
    const updatedNotes: Record<string, PinnwandNote> = { ...(data.pinnwand || {}) };

    let currentY = 80;

    roots.forEach((root) => {
      updatedNotes[root.id] = {
        ...updatedNotes[root.id],
        position: { x: 80, y: currentY }
      };

      const placeChildren = (parentId: string, parentX: number, startY: number): number => {
        const children = allNotes.filter(n => n.parentId === parentId);
        let childY = startY;

        children.forEach((child) => {
          const nextX = parentX + 320;
          updatedNotes[child.id] = {
            ...updatedNotes[child.id],
            position: { x: nextX, y: childY }
          };
          const nextStartY = placeChildren(child.id, nextX, childY);
          childY = Math.max(childY + 220, nextStartY);
        });

        return childY;
      };

      const branchEndY = placeChildren(root.id, 80, currentY);
      currentY = Math.max(currentY + 440, branchEndY + 80);
    });

    persistLocal({ ...data, pinnwand: updatedNotes });

    if (firebaseUser) {
      const promises = Object.values(updatedNotes).map(n => savePinnwandNoteToCloud(n));
      const p = Promise.all(promises);
      triggerSyncFeedback('Pinnwand geordnet', p);
    } else {
      triggerSyncFeedback('Pinnwand geordnet');
    }
  }, [data, firebaseUser, persistLocal, triggerSyncFeedback]);

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
  }, [isAdmin, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  // Automated Reset Check
  useEffect(() => {
    if (!isAppLoaded || !isAdmin || !data.settings.auto_reset_enabled) return;
    
    const checkReset = () => {
      const { scheduled_reset_day, scheduled_reset_hour, scheduled_reset_minute, last_reset_date } = data.settings;
      if (scheduled_reset_day === undefined || scheduled_reset_hour === undefined || scheduled_reset_minute === undefined) return;
      
      const now = new Date();
      const lastReset = last_reset_date ? new Date(last_reset_date) : new Date(0);
      
      // Calculate when the next reset should happen based on the settings
      // We want to see if "now" is past the scheduled time in the current week, 
      // AND if the last reset was before that scheduled time.
      
      const targetTimeThisWeek = new Date(now);
      const dayDiff = scheduled_reset_day - now.getDay();
      targetTimeThisWeek.setDate(now.getDate() + dayDiff);
      targetTimeThisWeek.setHours(scheduled_reset_hour, scheduled_reset_minute, 0, 0);
      
      // If targetTime was already in the past this week (e.g. it's Sunday and scheduled for Saturday)
      // we check if now > targetTime.
      // If lastReset is BEFORE targetTime and now is AFTER targetTime, we reset.
      
      if (now.getTime() >= targetTimeThisWeek.getTime() && lastReset.getTime() < targetTimeThisWeek.getTime()) {
        console.log('AppContext: Triggering automated weekly reset...');
        executeWeeklyReset();
      }
    };
    
    // Check on load and then every 5 minutes
    checkReset();
    const interval = setInterval(checkReset, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [isAppLoaded, isAdmin, data.settings, executeWeeklyReset]);

  return (
    <AppContext.Provider value={{
      isAppLoaded, isAuthResolving, data, activeUser, isAdmin, theme, toggleTheme,
      colorTheme, effectiveTheme, setColorTheme,
      sessions, recordSession, blockUserByEmail, unblockUserByEmail, blockedEmails,
      setActiveUserId, firebaseUser, syncStatus, syncFeedback, firebaseError,
      loginWithGoogle, loginWithApple, logoutFirebase, uploadAllToCloud, resetFirebaseCompletely, retrySync,
      logChore, updateLog, deleteLog, createTask, updateTask, deleteTask,
      fishTask, unfishTask,
      pinnwandNotes, createPinnwandNote, updatePinnwandNote, deletePinnwandNote,
      votePinnwandPoll, togglePinnwandReaction, updateNotePosition, autoArrangePinnwand,
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
        const nextSettings = { ...data.settings, ...u };
        let nextMembers = { ...data.members };

        // If default weekly target is updated, sync all members' individual targets
        if (u.default_weekly_target !== undefined) {
          Object.keys(nextMembers).forEach(id => {
            nextMembers[id] = { ...nextMembers[id], weekly_target: u.default_weekly_target };
          });
        }

        persistLocal({ ...data, settings: nextSettings, members: nextMembers });

        if (firebaseUser) {
          const promises = [saveSettingsToCloud(nextSettings)];
          if (u.default_weekly_target !== undefined) {
            Object.values(nextMembers).forEach(m => promises.push(saveMemberToCloud(m)));
          }
          triggerSyncFeedback('Einstellungen', Promise.all(promises));
        } else {
          triggerSyncFeedback('Einstellungen');
        }
      },
      updateDefaultWeeklyTarget: (t) => {
        const nextSettings = { ...data.settings, default_weekly_target: t };
        const nextMembers = { ...data.members };
        
        Object.keys(nextMembers).forEach(id => {
          nextMembers[id] = { ...nextMembers[id], weekly_target: t };
        });

        persistLocal({ ...data, settings: nextSettings, members: nextMembers });
        
        if (firebaseUser) {
          const promises = [
            saveSettingsToCloud(nextSettings),
            ...Object.values(nextMembers).map(m => saveMemberToCloud(m))
          ];
          triggerSyncFeedback('Wochenziel', Promise.all(promises));
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
      executeWeeklyReset,
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
