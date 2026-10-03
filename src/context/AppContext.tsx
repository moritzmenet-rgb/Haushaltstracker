import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ChoreLog, ColorTheme, FamilyData, FamilyMember, FamilySettings, PinnwandNote, PinnwandPoll, PostItColor, RewardCelebration, SessionLog, TaskItem, UserRole, WeeklyRollOverPreview, DayMenuPlan, PlannedMeal, MenuWish } from '../types';
import { INITIAL_FAMILY_DATA, DEMO_FAMILY_DATA, DEFAULT_HOUSEHOLD_TASKS, DEFAULT_PINNWAND_NOTES } from '../data/initialData';
import { ACHIEVEMENTS_DATA, AchievementDef } from '../data/achievementsData';
import { calculatePoints, calculateRollOverTarget, getMemberCyclePoints } from '../utils';
import { scanAndAwardHistoricalAchievements, computeLiveTrophyOwners } from '../utils/achievementScanner';
import { applyColorTheme } from '../theme';
import { CURRENT_VERSION, hasSeenCurrentVersion } from '../version';
import { 
  db, 
  auth, 
  isConfigValid,
  ensureAnonymousAuth,
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
  logChore: (taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string, customTimestamp?: string) => Promise<number>;
  updateLog: (logId: string, updates: {
    task_id?: string;
    user_id?: string;
    stars?: 1 | 2 | 3;
    actual_duration?: number;
    notes?: string;
    timestamp?: string;
  }) => Promise<boolean>;
  deleteLog: (logId: string) => Promise<boolean>;
  logPointsAdjustment?: (targetUserId: string, deltaPoints: number, reason?: string) => Promise<void>;

  // Task CRUD (Admin & Members)
  createTask: (task: Omit<TaskItem, 'id' | 'created_by' | 'last_done'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<boolean>;
  deleteTask: (taskId: string) => void;
  fishTask: (taskId: string, untilDate: string) => Promise<void>;
  unfishTask: (taskId: string) => Promise<void>;
  togglePinTask: (taskId: string, bonusPoints?: number) => Promise<boolean>;

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

  // What's new
  isWhatsNewOpen: boolean;
  openWhatsNew: () => void;
  closeWhatsNew: () => void;
  markCurrentVersionAsSeen: () => void;
  currentAppVersion: string;

  // App Rules & Reset (Admin)
  updateSettings: (updates: Partial<FamilySettings>) => void;
  updateDefaultWeeklyTarget: (newTarget: number) => void;
  getWeeklyRollOverPreview: () => WeeklyRollOverPreview[];
  executeWeeklyReset: () => void;

  // Reward Celebration & Dynamic Coin Flying Animation
  rewardCelebration: RewardCelebration | null;
  triggerRewardCelebration: (celebration: Omit<RewardCelebration, 'id'>) => void;
  clearRewardCelebration: () => void;

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

  // Badges & Trophies
  newlyUnlockedBadge: AchievementDef | null;
  clearNewlyUnlockedBadge: () => void;
  rescanAllAchievements: () => number;
  easterEggClickCount: number;
  triggerEasterEggClick: () => void;
  updateMemberBadgeShowroom: (memberId: string, badgeIds: string[]) => void;
  updateMemberActiveBadge: (memberId: string, updater: (current?: string) => string | undefined) => void;

  // Menuplanner (Meals, Week Plan & Ideas/Wishes)
  menuPlan: Record<string, DayMenuPlan>;
  menuWishes: MenuWish[];
  setDayMeal: (dateStr: string, mealType: 'lunch' | 'dinner', meal: PlannedMeal | null) => Promise<void>;
  addMenuWish: (title: string, notes?: string) => Promise<MenuWish>;
  deleteMenuWish: (wishId: string) => Promise<boolean>;
  toggleWishUpvote: (wishId: string) => Promise<boolean>;
  transferIngredientsToPinnwand: (mealTitle: string, ingredients: string[]) => Promise<boolean>;
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
      if (saved && ['indigo', 'emerald', 'rose', 'amber', 'daily', 'cyberpunk', 'sunset', 'forest'].includes(saved)) return saved;
    }
    return 'indigo';
  });

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<AchievementDef | null>(null);
  const clearNewlyUnlockedBadge = useCallback(() => setNewlyUnlockedBadge(null), []);

  const [easterEggClickCount, setEasterEggClickCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('household_easter_egg_clicks') || 0);
    }
    return 0;
  });

  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const openWhatsNew = useCallback(() => setIsWhatsNewOpen(true), []);
  const closeWhatsNew = useCallback(() => setIsWhatsNewOpen(false), []);
  const currentAppVersion = CURRENT_VERSION;

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
            // Ensure every member's total_points is strictly calculated from all existing logs
            const currentLogs: ChoreLog[] = Array.isArray(parsed.logs) ? parsed.logs : [];
            for (const mId of Object.keys(parsed.members)) {
              parsed.members[mId].total_points = currentLogs
                .filter((l: any) => l.user_id === mId)
                .reduce((sum: number, l: any) => sum + (Number(l.points_awarded) || 0), 0);
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
  const settingsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSettingsCloudSaveRef = useRef<{
    settings: FamilySettings;
    membersToSave?: FamilyMember[];
  } | null>(null);

  // Reward Celebration State
  const [rewardCelebration, setRewardCelebration] = useState<RewardCelebration | null>(null);
  const triggerRewardCelebration = useCallback((celebration: Omit<RewardCelebration, 'id'>) => {
    setRewardCelebration({ ...celebration, id: `celeb_${Date.now()}` });
  }, []);
  const clearRewardCelebration = useCallback(() => {
    setRewardCelebration(null);
  }, []);

  const updateMemberBadgeShowroom = useCallback(async (memberId: string, badgeIds: string[]) => {
    const member = data.members[memberId];
    if (!member) return;
    const updated = { ...member, showroom_badges: badgeIds };
    setData(prev => {
      const nextMembers = { ...prev.members, [memberId]: updated };
      const next = { ...prev, members: nextMembers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    saveMemberToCloud(updated).catch(console.warn);
  }, [data.members]);

  const updateMemberActiveBadge = useCallback(async (memberId: string, updater: (current?: string) => string | undefined) => {
    const member = data.members[memberId];
    if (!member) return;
    const nextBadgeId = updater(member.active_badge_id);
    const updated: FamilyMember = { 
      ...member, 
      active_badge_id: nextBadgeId || undefined,
      unlocked_badges: nextBadgeId ? { 
        ...(member.unlocked_badges || {}), 
        [nextBadgeId]: member.unlocked_badges?.[nextBadgeId] || new Date().toISOString(),
        badge_title: member.unlocked_badges?.['badge_title'] || new Date().toISOString()
      } : member.unlocked_badges
    };
    setData(prev => {
      const nextMembers = { ...prev.members, [memberId]: updated };
      const next = { ...prev, members: nextMembers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    saveMemberToCloud(updated).catch(console.warn);
  }, [data.members]);

  const triggerSyncFeedback = useCallback((actionName: string, cloudPromise?: Promise<any>) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (!cloudPromise) {
      setSyncFeedback({
        status: 'saved',
        text: `${actionName} gesichert`,
        timestamp: Date.now()
      });
      syncTimeoutRef.current = setTimeout(() => {
        setSyncFeedback(prev => prev.status === 'saved' ? { status: 'idle', text: '' } : prev);
      }, 2500);
      return Promise.resolve(true);
    }

    setSyncFeedback({
      status: 'uploading',
      text: `${actionName} wird gespeichert...`
    });

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
        }, 800);
        return true;
      })
      .catch((err) => {
        const isTimeout = err?.message === 'timeout';
        console.warn(isTimeout ? 'Sync timed out' : 'Sync notice:', err);
        
        setSyncFeedback({
          status: 'error',
          text: isTimeout 
            ? `Cloud-Verbindung langsam... (Timeout)` 
            : `Synchronisierung fehlgeschlagen.`
        });
        
        // Allow the user to dismiss the error after a few seconds
        syncTimeoutRef.current = setTimeout(() => {
          setSyncFeedback(prev => prev.status === 'error' ? { status: 'idle', text: '' } : prev);
        }, 4000);
        
        return false;
      });
  }, []);

  // Computed data state where members always have their total_points strictly calculated from all current logs,
  // and Wanderpokale (trophyOwners) are calculated 100% dynamically and switch live!
  const dataWithCalculatedPoints = useMemo<FamilyData>(() => {
    const computedMembers: Record<string, FamilyMember> = {};
    const logs = data.logs || [];
    for (const [id, member] of Object.entries(data.members || {})) {
      const calculatedTotal = logs
        .filter(l => l.user_id === id)
        .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
      computedMembers[id] = {
        ...member,
        total_points: calculatedTotal
      };
    }

    // Compute live trophy owners dynamically from all current logs & members!
    const liveTrophyOwners = computeLiveTrophyOwners(logs, computedMembers, data.trophyOwners);

    // If any member's active_badge_id is a trophy they no longer hold, disallow it
    for (const [id, member] of Object.entries(computedMembers)) {
      if (member.active_badge_id && member.active_badge_id.startsWith('trophy_')) {
        if (liveTrophyOwners[member.active_badge_id] !== id) {
          computedMembers[id] = {
            ...member,
            active_badge_id: undefined
          };
        }
      }
    }

    return {
      ...data,
      members: computedMembers,
      trophyOwners: liveTrophyOwners
    };
  }, [data]);

  const isAdmin = useMemo(() => {
    // Strictly determine admin rights from the currently active profile!
    // Non-admin members (e.g. children) must NEVER have admin rights.
    if (activeUserId && dataWithCalculatedPoints.members[activeUserId]) {
      return dataWithCalculatedPoints.members[activeUserId].role === 'admin';
    }
    // Only if the household has zero members yet and the owner is signed in, allow initial setup
    const totalMembers = Object.keys(dataWithCalculatedPoints.members || {}).length;
    if (totalMembers === 0 && firebaseUser?.email?.toLowerCase() === 'moritz.menet.bfsu@gmail.com') {
      return true;
    }
    return false;
  }, [firebaseUser, activeUserId, dataWithCalculatedPoints.members]);

  const activeUser = useMemo(() => activeUserId ? dataWithCalculatedPoints.members[activeUserId] || null : null, [activeUserId, dataWithCalculatedPoints.members]);

  // Automatically trigger the onboarding mini-tutorial on first account/profile opening,
  // or "Was ist neu" if tutorial is finished but version has updated
  useEffect(() => {
    if (!isAppLoaded || !activeUser) return;

    // 1. If activeUser has not seen the onboarding tutorial yet, open TutorialModal
    if (!activeUser.has_seen_tutorial) {
      setIsTutorialOpen(true);
      setIsWhatsNewOpen(false);
    } else if (!hasSeenCurrentVersion(activeUser.last_seen_version)) {
      // 2. If tutorial has been completed but new version has not been acknowledged, open WhatsNewModal
      setIsWhatsNewOpen(true);
    }
  }, [isAppLoaded, activeUser?.id, activeUser?.has_seen_tutorial, activeUser?.last_seen_version]);

  const markCurrentVersionAsSeen = useCallback(() => {
    if (!activeUser) return;
    const updated = { ...activeUser, last_seen_version: CURRENT_VERSION };
    setData(prev => ({
      ...prev,
      members: { ...prev.members, [activeUser.id]: updated }
    }));
    setIsWhatsNewOpen(false);
    if (firebaseUser) {
      saveMemberToCloud(updated);
    }
  }, [activeUser, firebaseUser]);

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
  }, [effectiveTheme, theme]);

  const persistLocal = useCallback((newData: FamilyData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
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
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
        // Automatically attempt anonymous login in background for seamless online-first token
        ensureAnonymousAuth().catch(console.warn);
      }
      
      setIsAuthResolving(false);
      setFirebaseError(null);
    });
    return unsub;
  }, [recordSession]);

  // Firestore Synchronizer (Always Online-First)
  useEffect(() => {
    if (!isConfigValid) {
      setIsAppLoaded(true);
      setSyncStatus('offline');
      return;
    }

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
          await seedAllDataToCloud(data);
        } else {
          const cloudData = snap.data();
          const cloudSettings = cloudData as FamilySettings;
          const cloudBlocked = (cloudData as any).blocked_emails || [];
          setBlockedEmails(cloudBlocked);

          // Security check: if current user is blocked, sign them out
          if (auth.currentUser?.email && cloudBlocked.includes(auth.currentUser.email.toLowerCase())) {
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
          const currentLogs = prev.logs || [];
          const updatedMembersMap: Record<string, FamilyMember> = {};
          for (const [mId, m] of Object.entries(membersMap)) {
            const calculatedTotal = currentLogs
              .filter(l => l.user_id === mId)
              .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
            updatedMembersMap[mId] = {
              ...m,
              active_badge_id: m.active_badge_id || undefined,
              total_points: calculatedTotal
            };
          }
          const next = { ...prev, members: updatedMembersMap };
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
        // Calculate each member's total_points strictly from the updated logs!
        const updatedMembers: Record<string, FamilyMember> = {};
        for (const [mId, m] of Object.entries(prev.members || {})) {
          const userLogsPoints = sorted
            .filter(l => l.user_id === mId)
            .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
          updatedMembers[mId] = {
            ...m,
            total_points: userLogsPoints
          };
        }
        const next = { ...prev, logs: sorted, members: updatedMembers };
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

      setData(prev => {
        const next = { ...prev, pinnwand: notesMap };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
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
  }, [syncRetryKey, isAdmin]);

  // CRUD Implementations (preserving original logic but calling cloud service)
  
  const logChore = useCallback(async (taskId: string, stars: 1 | 2 | 3, actualDuration: number, notes?: string, customTimestamp?: string): Promise<number> => {
    if (!activeUser) return 0;
    const task = data.tasks[taskId];
    if (!task) return 0;

    const now = customTimestamp || new Date().toISOString();
    const basePoints = calculatePoints(task.base_points, stars, data.settings, now);
    const pinnedBonus = (task.is_pinned && task.pinned_bonus_points) ? Number(task.pinned_bonus_points) : 0;
    const points = basePoints + pinnedBonus;
    const prevCyclePoints = getMemberCyclePoints(activeUser.id, data.logs, data.settings.last_reset_date);
    const targetPoints = activeUser.weekly_target || data.settings.default_weekly_target || 50;

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
    const nextLogs = [newLog, ...data.logs];
    const newTotalPoints = nextLogs
      .filter(l => l.user_id === activeUser.id)
      .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);

    const tempMember = {
      ...data.members[activeUser.id],
      total_points: newTotalPoints
    };

    const nextDataState: FamilyData = {
      ...data,
      tasks: { ...data.tasks, [taskId]: updatedTask },
      logs: nextLogs,
      members: { ...data.members, [activeUser.id]: tempMember }
    };

    // Full historical scan across all day-1 logs + the new log for all 30 achievements
    const scanResult = scanAndAwardHistoricalAchievements(nextDataState, activeUser.id, easterEggClickCount);
    const updatedMember = scanResult.updatedMembers[activeUser.id] || tempMember;

    if (scanResult.newlyUnlockedForActiveUser.length > 0) {
      setNewlyUnlockedBadge(scanResult.newlyUnlockedForActiveUser[0]);
    }

    persistLocal({
      ...data,
      tasks: { ...data.tasks, [taskId]: updatedTask },
      members: { ...data.members, ...scanResult.updatedMembers, [activeUser.id]: updatedMember },
      logs: [newLog, ...data.logs],
      trophyOwners: scanResult.trophyOwners
    });

    const cloudPromises: Promise<any>[] = [saveChoreLogToCloud(newLog, updatedTask, updatedMember)];
    // Ensure any other members with newly unlocked badges or Wanderpokale are synced to cloud 100%
    Object.values(scanResult.updatedMembers).forEach(m => {
      if (m.id !== activeUser.id) {
        const oldBadges = data.members[m.id]?.unlocked_badges || {};
        const newBadges = m.unlocked_badges || {};
        if (Object.keys(newBadges).length !== Object.keys(oldBadges).length) {
          cloudPromises.push(saveMemberToCloud(m));
        }
      }
    });

    const p = Promise.all(cloudPromises);
    await triggerSyncFeedback('Aufgabe erledigt', p);

    // Trigger gamified celebration & flying coins animation
    setRewardCelebration({
      id: `celeb_${Date.now()}`,
      points,
      taskTitle: task.title,
      stars,
      previousCyclePoints: prevCyclePoints,
      targetPoints
    });

    return points;
  }, [activeUser, data, persistLocal, triggerSyncFeedback]);

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
    const basePts = task
      ? calculatePoints(task.base_points, targetStars, data.settings, targetTimestamp)
      : oldLog.points_awarded;
    const pinnedBonus = (task?.is_pinned && task?.pinned_bonus_points) ? Number(task.pinned_bonus_points) : 0;
    const newPointsAwarded = basePts + pinnedBonus;

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

    const updatedLogs = data.logs.map(l => l.log_id === logId ? updatedLog : l);
    const updatedMembers = { ...data.members };
    
    // Recalculate total points strictly from all updated logs
    for (const mId of Object.keys(updatedMembers)) {
      const calculatedTotal = updatedLogs
        .filter(l => l.user_id === mId)
        .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);
      updatedMembers[mId] = {
        ...updatedMembers[mId],
        total_points: calculatedTotal
      };
    }

    persistLocal({
      ...data,
      members: updatedMembers,
      logs: updatedLogs
    });
    const p = saveChoreLogToCloud(updatedLog, data.tasks[targetTaskId], updatedMembers[targetUserId]);
    await triggerSyncFeedback('Eintrag aktualisiert', p);

    return true; 
  }, [isAdmin, activeUser, data, persistLocal, triggerSyncFeedback]);

  const deleteLog = useCallback(async (logId: string) => {
    const log = data.logs.find(l => l.log_id === logId);
    if (!log) return false;

    const filteredLogs = data.logs.filter(l => l.log_id !== logId);
    const member = data.members[log.user_id];
    const task = data.tasks[log.task_id];

    // Recalculate new total points strictly from all remaining logs
    const newTotalPoints = filteredLogs
      .filter(l => l.user_id === log.user_id)
      .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);

    let updatedMember: FamilyMember | undefined;
    if (member) {
      updatedMember = {
        ...member,
        total_points: newTotalPoints
      };
    }

    // Determine if we need to update task's last_done
    let updatedTask: TaskItem | undefined;
    if (task && task.last_done === log.timestamp) {
      // Find the next most recent log for this task
      const remainingLogsForTask = filteredLogs
        .filter(l => l.task_id === log.task_id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const nextRecentLog = remainingLogsForTask[0];
      
      const realTaskId = task.id || log.task_id;
      updatedTask = {
        ...task,
        id: realTaskId,
        last_done: nextRecentLog ? nextRecentLog.timestamp : null,
        is_pinned: task.is_pinned ?? false,
        pinned_bonus_points: task.pinned_bonus_points ?? 0
      };
    }

    const nextMembers = updatedMember 
      ? { ...data.members, [log.user_id]: updatedMember } 
      : data.members;

    const realTaskId = task ? (task.id || log.task_id) : log.task_id;
    const nextTasks = { ...data.tasks };
    if (updatedTask && task && realTaskId) {
      nextTasks[realTaskId] = updatedTask;
    }

    const nextData: FamilyData = {
      ...data,
      logs: filteredLogs,
      members: nextMembers,
      tasks: nextTasks
    };

    // Optimistic Update
    persistLocal(nextData);

    const p = deleteChoreLogFromCloud(logId, updatedTask, updatedMember);
    await triggerSyncFeedback('Eintrag gelöscht', p);
    return true;
  }, [data, persistLocal, triggerSyncFeedback]);

  const logPointsAdjustment = useCallback(async (targetUserId: string, deltaPoints: number, reason?: string) => {
    const targetMember = data.members[targetUserId];
    if (!targetMember || deltaPoints === 0) return;

    const now = new Date().toISOString();
    const newLog: ChoreLog = {
      log_id: `log_adj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      task_id: 'special_adjustment',
      user_id: targetUserId,
      stars: 3,
      points_awarded: deltaPoints,
      actual_duration: 0,
      timestamp: now,
      notes: reason?.trim() || (deltaPoints > 0 ? 'Sonderpunkte / Bonus' : 'Punkte-Korrektur')
    };

    const nextLogs = [newLog, ...data.logs];
    const newTotalPoints = nextLogs
      .filter(l => l.user_id === targetUserId)
      .reduce((sum, l) => sum + (Number(l.points_awarded) || 0), 0);

    const updatedMember = {
      ...targetMember,
      total_points: newTotalPoints
    };

    const nextDataState: FamilyData = {
      ...data,
      logs: nextLogs,
      members: { ...data.members, [targetUserId]: updatedMember }
    };

    persistLocal(nextDataState);

    const p = saveChoreLogToCloud(newLog, {
      id: 'special_adjustment',
      title: 'Sonderpunkte / Bonus',
      description: 'Manuelle Punkte-Anpassung durch Admin',
      category: 'Allgemein',
      base_points: Math.abs(deltaPoints),
      estimated_duration: 0,
      interval_days: 1,
      created_by: 'Admin',
      last_done: now
    }, updatedMember);
    await triggerSyncFeedback('Punkte angepasst', p);
  }, [data, persistLocal, triggerSyncFeedback]);

  const createTask = useCallback(async (task: any) => {
    const id = `task_${Date.now()}`;
    const newTask = { ...task, id, created_by: activeUser?.name || 'Familie', last_done: null };
    setData(prev => {
      const nextTasks = { ...prev.tasks, [id]: newTask };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const p = saveTaskToCloud(newTask);
    await triggerSyncFeedback('Aufgabe erstellt', p);
  }, [activeUser, triggerSyncFeedback]);

  const updateTask = useCallback(async (id: string, updates: any): Promise<boolean> => {
    const currentTask = data.tasks[id];
    if (!currentTask) return false;
    const updated = { ...currentTask, ...updates };
    setData(prev => {
      const nextTasks = { ...prev.tasks, [id]: updated };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const p = saveTaskToCloud(updated);
    await triggerSyncFeedback('Aufgabe geändert', p);
    return true;
  }, [data.tasks, triggerSyncFeedback]);

  const deleteTask = useCallback(async (id: string) => {
    const { [id]: _, ...remaining } = data.tasks;
    const nextData = { ...data, tasks: remaining };
    
    // Optimistic Update
    persistLocal(nextData);

    const p = deleteTaskFromCloud(id);
    await triggerSyncFeedback('Aufgabe gelöscht', p);
  }, [data, persistLocal, triggerSyncFeedback]);

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
    
    const p = saveTaskToCloud(updated);
    await triggerSyncFeedback('Aufgabe gefischt', p);
  }, [activeUser, data.tasks, triggerSyncFeedback]);

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
    
    const p = saveTaskToCloud(updated);
    await triggerSyncFeedback('Reservierung aufgehoben', p);
  }, [data.tasks, triggerSyncFeedback]);

  const togglePinTask = useCallback(async (taskId: string, bonusPoints?: number): Promise<boolean> => {
    const currentTask = data.tasks[taskId];
    if (!currentTask) return false;
    const willPin = !currentTask.is_pinned;
    const newBonus = willPin ? (bonusPoints !== undefined ? bonusPoints : (currentTask.pinned_bonus_points || 20)) : (currentTask.pinned_bonus_points || 0);
    const updated: TaskItem = {
      ...currentTask,
      is_pinned: willPin,
      pinned_bonus_points: newBonus
    };
    setData(prev => {
      const nextTasks = { ...prev.tasks, [taskId]: updated };
      const next = { ...prev, tasks: nextTasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const p = saveTaskToCloud(updated);
    await triggerSyncFeedback(willPin ? 'Aufgabe oben angepinnt 📌' : 'Aufgabe abgepinnt', p);
    return true;
  }, [data.tasks, triggerSyncFeedback]);

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
    const p = saveMemberToCloud(newMember);
    await triggerSyncFeedback('Profil erstellt', p);
    return newMember;
  }, [triggerSyncFeedback]);

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

    persistLocal(nextData);
    const p = seedAllDataToCloud(nextData);
    await triggerSyncFeedback('Profil eingerichtet', p);
    
    setActiveUserIdState(id);
    localStorage.setItem(ACTIVE_USER_KEY, id);

    return adminMember;
  }, [data, persistLocal, triggerSyncFeedback]);

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
    const p = saveMemberToCloud(updated);
    await triggerSyncFeedback('Profil aktualisiert', p);
  }, [data.members, triggerSyncFeedback]);

  const deleteMember = useCallback(async (id: string) => {
    const { [id]: _, ...remainingMembers } = data.members;
    const nextData = { ...data, members: remainingMembers };
    
    // Optimistic Update
    persistLocal(nextData);

    const p = deleteMemberFromCloud(id);
    await triggerSyncFeedback('Profil gelöscht', p);
  }, [data, persistLocal, triggerSyncFeedback]);

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
    setSyncStatus('connecting');
    const p = seedAllDataToCloud(data);
    triggerSyncFeedback('Alle Daten', p);
    await p;
    setSyncStatus('synced');
  }, [data, triggerSyncFeedback]);

  const resetFirebaseCompletely = useCallback(async () => {
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
  }, [persistLocal, triggerSyncFeedback]);

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

    persistLocal({ ...data, pinnwand: { ...(data.pinnwand || {}), [noteId]: newNote } });
    const p = savePinnwandNoteToCloud(newNote);
    triggerSyncFeedback(newNote.parentId ? 'Antwort angeheftet' : 'Neues Thema angeheftet', p);

    return newNote;
  }, [activeUser, data, persistLocal, triggerSyncFeedback]);

  const updatePinnwandNote = useCallback(async (noteId: string, updates: Partial<PinnwandNote>): Promise<boolean> => {
    let targetNote: PinnwandNote | null = null;
    setData(prev => {
      const existing = prev.pinnwand?.[noteId];
      if (!existing) return prev;

      const updatedNote: PinnwandNote = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      targetNote = updatedNote;

      const nextPinnwand = { ...(prev.pinnwand || {}), [noteId]: updatedNote };
      const next = { ...prev, pinnwand: nextPinnwand };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (targetNote) {
      const p = savePinnwandNoteToCloud(targetNote);
      triggerSyncFeedback('Post-it aktualisiert', p);
    }

    return true;
  }, [triggerSyncFeedback]);

  const deletePinnwandNote = useCallback(async (noteId: string): Promise<boolean> => {
    let idsToDelete: string[] = [];
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
    idsToDelete = Array.from(notesToDelete);

    if (idsToDelete.length === 0) return false;

    const nextPinnwand = { ...(data.pinnwand || {}) };
    idsToDelete.forEach(id => delete nextPinnwand[id]);
    const nextData = { ...data, pinnwand: nextPinnwand };
    
    // Optimistic Update
    persistLocal(nextData);

    const p = Promise.all(idsToDelete.map(id => deletePinnwandNoteFromCloud(id)));
    await triggerSyncFeedback('Post-it entfernt', p);

    return true;
  }, [data, persistLocal, triggerSyncFeedback]);

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

    const p = savePinnwandNoteToCloud(updatedNote);
    triggerSyncFeedback('Stimme gezählt', p);

    return true;
  }, [activeUser, data, persistLocal, triggerSyncFeedback]);

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

    const p = savePinnwandNoteToCloud(updatedNote);
    triggerSyncFeedback('Reaktion aktualisiert', p);

    return true;
  }, [activeUser, data, persistLocal, triggerSyncFeedback]);

  const updateNotePosition = useCallback((noteId: string, position: { x: number; y: number }) => {
    let targetNote: PinnwandNote | null = null;
    setData(prev => {
      const note = prev.pinnwand?.[noteId];
      if (!note) return prev;
      const updatedNote: PinnwandNote = {
        ...note,
        position
      };
      targetNote = updatedNote;
      const nextPinnwand = { ...(prev.pinnwand || {}), [noteId]: updatedNote };
      const next = { ...prev, pinnwand: nextPinnwand };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (targetNote) {
      savePinnwandNoteToCloud(targetNote).catch(console.warn);
    }
  }, []);

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

    const promises = Object.values(updatedNotes).map(n => savePinnwandNoteToCloud(n));
    const p = Promise.all(promises);
    triggerSyncFeedback('Pinnwand geordnet', p);
  }, [data, persistLocal, triggerSyncFeedback]);

  const executeWeeklyReset = useCallback(() => {
    if (!isAdmin) return;
    const baseDefault = data.settings.default_weekly_target || 50;
    const updatedMembers = { ...data.members };

    Object.values(updatedMembers).forEach(member => {
      // Add the base target for the new week to the existing cumulative target
      const oldTarget = member.weekly_target || baseDefault;
      const newTarget = oldTarget + baseDefault;
      
      // We still clamp it to a maximum to avoid infinite growth, but use a higher default
      const max = data.settings.rollover_max_target ?? 5000;
      
      updatedMembers[member.id] = { 
        ...member, 
        weekly_target: Math.min(max, newTarget) 
      };
    });

    const nextSettings: FamilySettings = {
      ...data.settings,
      // We do NOT update last_reset_date here, because we want points to keep accumulating.
      // We update last_scheduled_run to mark that this cycle has been processed.
      last_scheduled_run: new Date().toISOString()
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
      triggerSyncFeedback('Wochenziel erhöht', p);
    } else {
      triggerSyncFeedback('Wochenziel erhöht');
    }
  }, [isAdmin, data, firebaseUser, persistLocal, triggerSyncFeedback]);

  // --- Continuous Historical Scanner from Day 1 for All 30 Achievements & Trophies ---
  const rescanAllAchievements = useCallback((): number => {
    const scanResult = scanAndAwardHistoricalAchievements(data, activeUserId, easterEggClickCount);
    let newBadgesCount = 0;
    if (scanResult.hasChanges) {
      setData(prev => ({
        ...prev,
        members: scanResult.updatedMembers,
        trophyOwners: scanResult.trophyOwners
      }));
      persistLocal({
        ...data,
        members: scanResult.updatedMembers,
        trophyOwners: scanResult.trophyOwners
      });
      Object.values(scanResult.updatedMembers).forEach(m => {
        const oldBadges = data.members[m.id]?.unlocked_badges || {};
        const newBadges = m.unlocked_badges || {};
        if (Object.keys(newBadges).length !== Object.keys(oldBadges).length) {
          saveMemberToCloud(m).catch(console.warn);
        }
      });
      newBadgesCount = scanResult.newlyUnlockedForActiveUser.length;
      if (newBadgesCount > 0) {
        setNewlyUnlockedBadge(scanResult.newlyUnlockedForActiveUser[0]);
      }
    }
    return newBadgesCount;
  }, [data, activeUserId, easterEggClickCount, firebaseUser, persistLocal]);

  // Triggered automatically on boot, data changes, and member changes
  useEffect(() => {
    if (!isAppLoaded) return;
    const scanResult = scanAndAwardHistoricalAchievements(data, activeUserId, easterEggClickCount);
    if (scanResult.hasChanges) {
      setData(prev => ({
        ...prev,
        members: scanResult.updatedMembers,
        trophyOwners: scanResult.trophyOwners
      }));
      persistLocal({
        ...data,
        members: scanResult.updatedMembers,
        trophyOwners: scanResult.trophyOwners
      });
      Object.values(scanResult.updatedMembers).forEach(m => {
        const oldBadges = data.members[m.id]?.unlocked_badges || {};
        const newBadges = m.unlocked_badges || {};
        if (Object.keys(newBadges).length !== Object.keys(oldBadges).length) {
          saveMemberToCloud(m).catch(console.warn);
        }
      });
      if (scanResult.newlyUnlockedForActiveUser.length > 0 && !newlyUnlockedBadge) {
        setNewlyUnlockedBadge(scanResult.newlyUnlockedForActiveUser[0]);
      }
    }
  }, [isAppLoaded, data.logs, activeUserId, easterEggClickCount]);

  const triggerEasterEggClick = useCallback(() => {
    setEasterEggClickCount(prev => {
      const next = prev + 1;
      localStorage.setItem('household_easter_egg_clicks', String(next));
      if (next >= 10 && activeUser) {
        const def = ACHIEVEMENTS_DATA.find(b => b.id === 'secret_easter_egg');
        if (def && (!activeUser.unlocked_badges || !activeUser.unlocked_badges['secret_easter_egg'])) {
          const nextBadges = { ...(activeUser.unlocked_badges || {}), secret_easter_egg: new Date().toISOString() };
          setData(d => ({
            ...d,
            members: {
              ...d.members,
              [activeUser.id]: {
                ...d.members[activeUser.id],
                unlocked_badges: nextBadges
              }
            }
          }));
          saveMemberToCloud({ ...activeUser, unlocked_badges: nextBadges }).catch(console.warn);
          setNewlyUnlockedBadge(def);
        }
      }
      return next;
    });
  }, [activeUser]);

  // Automated Reset Check
  useEffect(() => {
    if (!isAppLoaded || !isAdmin || !data.settings.auto_reset_enabled) return;
    
    const checkReset = () => {
      const { scheduled_reset_day, scheduled_reset_hour, scheduled_reset_minute, last_reset_date, last_scheduled_run } = data.settings;
      if (scheduled_reset_day === undefined || scheduled_reset_hour === undefined || scheduled_reset_minute === undefined) return;
      
      const now = new Date();
      // Use last_scheduled_run to determine if we already ran for the latest scheduled slot
      const lastCheck = last_scheduled_run ? new Date(last_scheduled_run) : (last_reset_date ? new Date(last_reset_date) : new Date(0));
      
      const targetTimeThisWeek = new Date(now);
      const dayDiff = scheduled_reset_day - now.getDay();
      targetTimeThisWeek.setDate(now.getDate() + dayDiff);
      targetTimeThisWeek.setHours(scheduled_reset_hour, scheduled_reset_minute, 0, 0);
      
      if (now.getTime() >= targetTimeThisWeek.getTime() && lastCheck.getTime() < targetTimeThisWeek.getTime()) {
        console.log('AppContext: Triggering automated weekly goal increase...');
        executeWeeklyReset();
      }
    };
    
    // Check on load and then every 5 minutes
    checkReset();
    const interval = setInterval(checkReset, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [isAppLoaded, isAdmin, data.settings, executeWeeklyReset]);

  // Menuplanner Hooks & Methods
  const menuPlan = useMemo(() => data.menuPlan || {}, [data.menuPlan]);
  
  const menuWishes = useMemo(() => {
    return Object.values(data.menuWishes || {}).sort((a, b) => {
      if (b.upvotes.length !== a.upvotes.length) return b.upvotes.length - a.upvotes.length;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data.menuWishes]);

  const setDayMeal = useCallback(async (dateStr: string, mealType: 'lunch' | 'dinner', meal: PlannedMeal | null) => {
    setData(prev => {
      const currentDay = prev.menuPlan?.[dateStr] || {};
      const updatedDay: DayMenuPlan = {
        ...currentDay,
        [mealType]: meal
      };
      const nextMenuPlan = {
        ...(prev.menuPlan || {}),
        [dateStr]: updatedDay
      };
      const next = { ...prev, menuPlan: nextMenuPlan };
      persistLocal(next);
      return next;
    });

    try {
      if (isConfigValid && db) {
        const mealDocRef = doc(db, 'households', HOUSEHOLD_ID, 'menus', dateStr);
        await setDoc(mealDocRef, {
          date: dateStr,
          [mealType]: meal || null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Menu cloud sync notice:', e);
    }
  }, [persistLocal]);

  const addMenuWish = useCallback(async (title: string, notes?: string): Promise<MenuWish> => {
    const id = `wish_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newWish: MenuWish = {
      id,
      title: title.trim(),
      requestedBy: activeUser?.id || 'guest',
      requestedByName: activeUser?.name || 'Familienmitglied',
      notes: notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      upvotes: activeUser ? [activeUser.id] : [],
      planned: false
    };

    setData(prev => {
      const nextWishes = { ...(prev.menuWishes || {}), [id]: newWish };
      const next = { ...prev, menuWishes: nextWishes };
      persistLocal(next);
      return next;
    });

    try {
      if (isConfigValid && db) {
        const wishDocRef = doc(db, 'households', HOUSEHOLD_ID, 'menu_wishes', id);
        await setDoc(wishDocRef, newWish);
      }
    } catch (e) {
      console.warn('Wish cloud sync notice:', e);
    }

    return newWish;
  }, [activeUser, persistLocal]);

  const deleteMenuWish = useCallback(async (wishId: string): Promise<boolean> => {
    setData(prev => {
      const nextWishes = { ...(prev.menuWishes || {}) };
      delete nextWishes[wishId];
      const next = { ...prev, menuWishes: nextWishes };
      persistLocal(next);
      return next;
    });
    return true;
  }, [persistLocal]);

  const toggleWishUpvote = useCallback(async (wishId: string): Promise<boolean> => {
    if (!activeUser) return false;
    setData(prev => {
      const wish = prev.menuWishes?.[wishId];
      if (!wish) return prev;
      const hasUpvoted = wish.upvotes.includes(activeUser.id);
      const updatedUpvotes = hasUpvoted
        ? wish.upvotes.filter(uid => uid !== activeUser.id)
        : [...wish.upvotes, activeUser.id];
      const updatedWish = { ...wish, upvotes: updatedUpvotes };
      const next = {
        ...prev,
        menuWishes: {
          ...(prev.menuWishes || {}),
          [wishId]: updatedWish
        }
      };
      persistLocal(next);
      return next;
    });
    return true;
  }, [activeUser, persistLocal]);

  const transferIngredientsToPinnwand = useCallback(async (mealTitle: string, ingredients: string[]): Promise<boolean> => {
    const content = `🛒 Zutaten für: ${mealTitle}\n\n` + ingredients.map(ing => `• ${ing}`).join('\n');
    await createPinnwandNote({
      title: `Einkauf: ${mealTitle}`,
      content,
      color: 'yellow',
      category: 'Einkauf'
    });
    return true;
  }, [createPinnwandNote]);

  return (
    <AppContext.Provider value={{
      isAppLoaded, isAuthResolving, data: dataWithCalculatedPoints, activeUser, isAdmin, theme, toggleTheme,
      colorTheme, effectiveTheme, setColorTheme,
      sessions, recordSession, blockUserByEmail, unblockUserByEmail, blockedEmails,
      setActiveUserId, firebaseUser, syncStatus, syncFeedback, firebaseError,
      loginWithGoogle, loginWithApple, logoutFirebase, uploadAllToCloud, resetFirebaseCompletely, retrySync,
      logChore, updateLog, deleteLog, logPointsAdjustment, createTask, updateTask, deleteTask,
      fishTask, unfishTask, togglePinTask,
      rewardCelebration, triggerRewardCelebration, clearRewardCelebration,
      pinnwandNotes, createPinnwandNote, updatePinnwandNote, deletePinnwandNote,
      votePinnwandPoll, togglePinnwandReaction, updateNotePosition, autoArrangePinnwand,
      menuPlan, menuWishes, setDayMeal, addMenuWish, deleteMenuWish, toggleWishUpvote, transferIngredientsToPinnwand,
      addCategory: (c) => {
        if (data.settings.categories.includes(c)) return false;
        const next = { ...data.settings, categories: [...data.settings.categories, c] };
        persistLocal({ ...data, settings: next });
        triggerSyncFeedback('Kategorie erstellt', saveSettingsToCloud(next));
        return true;
      },
      renameCategory: (old, next) => {
        const categories = data.settings.categories.map(c => c === old ? next : c);
        const nextSettings = { ...data.settings, categories };
        persistLocal({ ...data, settings: nextSettings });
        triggerSyncFeedback('Kategorie umbenannt', saveSettingsToCloud(nextSettings));
        return true;
      },
      deleteCategory: (c) => {
        const categories = data.settings.categories.filter(cat => cat !== c);
        const nextSettings = { ...data.settings, categories };
        persistLocal({ ...data, settings: nextSettings });
        triggerSyncFeedback('Kategorie gelöscht', saveSettingsToCloud(nextSettings));
        return true;
      },
      addMember, initializeAdminProfile, updateMember, deleteMember,
      updateProfile: (u) => activeUserId && updateMember(activeUserId, u),
      isTutorialOpen, openTutorial: () => setIsTutorialOpen(true),
      closeTutorial: () => {
        setIsTutorialOpen(false);
        if (activeUserId && activeUser && !activeUser.has_seen_tutorial) {
          updateMember(activeUserId, { 
            has_seen_tutorial: true,
            last_seen_version: CURRENT_VERSION
          });
        }
      },
      completeTutorial: () => {
        setIsTutorialOpen(false);
        if (activeUserId) {
          updateMember(activeUserId, { 
            has_seen_tutorial: true,
            last_seen_version: CURRENT_VERSION
          });
        }
      },
      updateSettings: (u) => {
        let currentSettings: FamilySettings = data.settings;
        let currentMembers = data.members;

        setData(prev => {
          const nextSettings = { ...prev.settings, ...u };
          let nextMembers = { ...prev.members };

          // If default weekly target is updated, sync all members' individual targets
          if (typeof u.default_weekly_target === 'number') {
            const newTarget = u.default_weekly_target;
            Object.keys(nextMembers).forEach(id => {
              nextMembers[id] = { ...nextMembers[id], weekly_target: newTarget };
            });
          }

          const nextData = { ...prev, settings: nextSettings, members: nextMembers };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));

          currentSettings = nextSettings;
          currentMembers = nextMembers;
          return nextData;
        });

        pendingSettingsCloudSaveRef.current = {
          settings: currentSettings,
          membersToSave: u.default_weekly_target !== undefined ? Object.values(currentMembers) : undefined
        };

        if (settingsDebounceTimerRef.current) {
          clearTimeout(settingsDebounceTimerRef.current);
        }

        settingsDebounceTimerRef.current = setTimeout(async () => {
          const pending = pendingSettingsCloudSaveRef.current;
          if (!pending) return;
          try {
            const promises = [saveSettingsToCloud(pending.settings)];
            if (pending.membersToSave) {
              pending.membersToSave.forEach(m => promises.push(saveMemberToCloud(m)));
            }
            await triggerSyncFeedback('Einstellungen', Promise.all(promises));
          } catch (err) {
            console.warn('Settings cloud sync notice, retrying once:', err);
            try {
              await new Promise(r => setTimeout(r, 500));
              await saveSettingsToCloud(pending.settings);
            } catch (retryErr) {
              console.warn('Settings retry notice:', retryErr);
            }
          }
        }, 350);
      },
      updateDefaultWeeklyTarget: (t) => {
        const nextSettings = { ...data.settings, default_weekly_target: t };
        const nextMembers = { ...data.members };
        
        Object.keys(nextMembers).forEach(id => {
          nextMembers[id] = { ...nextMembers[id], weekly_target: t };
        });

        persistLocal({ ...data, settings: nextSettings, members: nextMembers });
        
        const promises = [
          saveSettingsToCloud(nextSettings),
          ...Object.values(nextMembers).map(m => saveMemberToCloud(m))
        ];
        triggerSyncFeedback('Wochenziel', Promise.all(promises));
      },
      getWeeklyRollOverPreview: () => {
        const baseDefault = data.settings.default_weekly_target || 50;
        return Object.values(data.members).map(member => {
          const oldTarget = member.weekly_target || baseDefault;
          const newTarget = oldTarget + baseDefault;
          const cyclePoints = getMemberCyclePoints(member.id, data.logs, data.settings.last_reset_date);
          const difference = oldTarget - cyclePoints;
          
          return {
            memberId: member.id,
            memberName: member.name,
            oldTarget,
            achievedPoints: cyclePoints,
            difference,
            newTarget: Math.min(data.settings.rollover_max_target ?? 5000, newTarget)
          };
        });
      },
      executeWeeklyReset,
      clearAllData: async () => {
        persistLocal(INITIAL_FAMILY_DATA);
        setActiveUserIdState(null);
        localStorage.removeItem(ACTIVE_USER_KEY);
        const p = clearAllCloudData();
        triggerSyncFeedback('Daten gelöscht', p);
        await p;
      },
      resetToDemoData: async () => {
        persistLocal(INITIAL_FAMILY_DATA);
        setActiveUserIdState(null);
        localStorage.removeItem(ACTIVE_USER_KEY);
        const p = clearAllCloudData();
        await triggerSyncFeedback('Haushalt geleert', p);
        await p;
      },
      exportDataJSON: () => JSON.stringify(data),
      importDataJSON: (j) => {
        try {
          const p = JSON.parse(j);
          if (p.members) { persistLocal(p); return true; }
        } catch { /* */ }
        return false;
      },
      newlyUnlockedBadge,
      clearNewlyUnlockedBadge,
      rescanAllAchievements,
      easterEggClickCount,
      triggerEasterEggClick,
      updateMemberBadgeShowroom,
      updateMemberActiveBadge,
      isWhatsNewOpen,
      openWhatsNew,
      closeWhatsNew,
      markCurrentVersionAsSeen,
      currentAppVersion
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
