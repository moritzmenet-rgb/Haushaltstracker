import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TaskCatalog } from './components/TaskCatalog';
import { AdminSettings } from './components/AdminSettings';
import { ProfileSelector } from './components/ProfileSelector';
import { LogChoreModal } from './components/LogChoreModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TutorialModal } from './components/TutorialModal';
import { PinnwandBoard } from './components/pinnwand/PinnwandBoard';
import { BadgesMuseum } from './components/BadgesMuseum';
import { AchievementRevealModal } from './components/AchievementRevealModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { SyncFeedbackBanner } from './components/SyncFeedbackBanner';
import { SyncOverlay } from './components/SyncOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChoreCompletionCelebration } from './components/ChoreCompletionCelebration';
import { WhatsNewModal } from './components/WhatsNewModal';
import { TaskItem, ChoreLog } from './types';
import { Cloud, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    isAppLoaded, 
    isAuthResolving, 
    data, 
    firebaseUser, 
    activeUser, 
    isTutorialOpen, 
    closeTutorial, 
    completeTutorial, 
    syncStatus,
    rewardCelebration,
    clearRewardCelebration,
    isWhatsNewOpen,
    openWhatsNew,
    closeWhatsNew,
    markCurrentVersionAsSeen,
    currentAppVersion,
    newlyUnlockedBadge,
    clearNewlyUnlockedBadge,
    updateMemberActiveBadge
  } = useApp();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'pinnwand' | 'abzeichen' | 'settings'>('dashboard');

  // Close log modal when celebration triggers without forcibly switching tabs
  useEffect(() => {
    if (rewardCelebration) {
      setIsLogModalOpen(false);
    }
  }, [rewardCelebration]);

  const isDataEmpty = Object.keys(data.members).length === 0;
  const isCloudConnecting = Boolean(syncStatus === 'connecting' && isDataEmpty && !isAppLoaded);

  // Hide the HTML loading screen when app is ready
  useEffect(() => {
    if (isAppLoaded) {
      console.log('MainContent: isAppLoaded is true. Hiding loader...');
      const loader = document.getElementById('app-loading');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    }
  }, [isAppLoaded]);

  // Modal states
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [logModalTaskId, setLogModalTaskId] = useState<string | null>(null);
  const [logToEdit, setLogToEdit] = useState<ChoreLog | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [taskFormModalState, setTaskFormModalState] = useState<{
    isOpen: boolean;
    taskToEdit?: TaskItem | null;
  }>({ isOpen: false, taskToEdit: null });

  // --- Achievement Sequencing Logic ---
  // We want to show the achievement ONLY after the coin celebration is finished.
  const [delayedBadge, setDelayedBadge] = useState<any>(null);

  useEffect(() => {
    if (newlyUnlockedBadge && !rewardCelebration) {
      // Small additional safety delay to ensure celebration transition is fully gone
      const timer = setTimeout(() => {
        setDelayedBadge(newlyUnlockedBadge);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!newlyUnlockedBadge) {
      setDelayedBadge(null);
    }
  }, [newlyUnlockedBadge, rewardCelebration]);

  // Open profile selector automatically if no user is active
  useEffect(() => {
    if (!activeUser) {
      setShowProfileSelector(true);
    }
  }, [activeUser]);

  const handleOpenLogModal = (taskId?: string) => {
    setLogModalTaskId(taskId || null);
    setLogToEdit(null);
    setIsLogModalOpen(true);
  };

  const handleOpenEditLogModal = (log: ChoreLog) => {
    setLogModalTaskId(log.task_id);
    setLogToEdit(log);
    setIsLogModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--m3-surface)] text-[var(--m3-on-surface)] transition-colors duration-200 flex flex-col relative overflow-x-hidden m3-ambient-canvas">
      {/* Material 3 Expressive Dynamic Tonal Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none" aria-hidden="true">
        {/* M3 Primary Container Soft Hue (Top Right) */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[var(--m3-primary-container)] opacity-35 dark:opacity-20 blur-[120px] transition-all duration-700" />
        
        {/* M3 Tertiary / Secondary Soft Tint (Bottom Left) */}
        <div className="absolute top-1/2 -left-32 w-[480px] h-[480px] rounded-full bg-[var(--m3-secondary-container)] opacity-30 dark:opacity-15 blur-[130px] transition-all duration-700" />
      </div>

      {/* PWA Install Notification Prompt */}
      <PWAInstallBanner />

      {/* Real-time Cloud Upload & Saved Banner */}
      <SyncFeedbackBanner />
      
      {/* Blocking Sync Overlay for critical updates */}
      <SyncOverlay />

      {/* Main App Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenProfileSelector={() => setShowProfileSelector(true)}
        onOpenLogModal={() => handleOpenLogModal()}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 pt-5 pb-36 sm:pb-24 ${
        currentTab === 'pinnwand' ? 'max-w-6xl' : 'max-w-5xl'
      }`}>
        {currentTab === 'dashboard' && (
          <Dashboard
            onOpenLogModal={handleOpenLogModal}
            onEditLog={handleOpenEditLogModal}
            onOpenTaskHistory={(taskId) => setHistoryTaskId(taskId)}
            onNavigateToTasks={() => setCurrentTab('tasks')}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskCatalog
            onOpenLogModal={(taskId) => handleOpenLogModal(taskId)}
            onOpenTaskHistory={(taskId) => setHistoryTaskId(taskId)}
            onOpenCreateTaskModal={() => setTaskFormModalState({ isOpen: true, taskToEdit: null })}
            onOpenEditTaskModal={(task) => setTaskFormModalState({ isOpen: true, taskToEdit: task })}
          />
        )}

        {currentTab === 'pinnwand' && <PinnwandBoard />}

        {currentTab === 'abzeichen' && <BadgesMuseum />}

        {currentTab === 'settings' && <AdminSettings />}
      </main>

      {/* Footer (Visible on desktop and mobile with safe padding) */}
      <footer className="py-6 pb-28 sm:pb-6 border-t border-[var(--m3-outline-variant)]/60 text-center text-xs text-[var(--m3-on-surface-variant)] transition-colors">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-[var(--m3-on-surface)]">
              {data.settings.household_name || 'Fish & Wish'}
            </span>
            <span>•</span>
            {/* Clickable Version Badge with playful pulse and hover */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={openWhatsNew}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-primary)] border border-[var(--m3-outline-variant)] text-[11px] font-extrabold transition shadow-2xs cursor-pointer group"
              title="Versionshinweise und Neuerungen anzeigen"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span>v{currentAppVersion}</span>
              <span className="text-[10px] text-[var(--m3-on-surface-variant)] group-hover:text-[var(--m3-primary)] font-bold transition">
                • Was ist neu? ✨
              </span>
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileSelector(true)}
              className="hover:text-[var(--m3-on-surface)] transition font-medium cursor-pointer"
            >
              Profil wechseln
            </button>
            <span>•</span>
            <span className="text-emerald-500 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Cloud-Sync aktiv (Online-First)
            </span>
          </div>
        </div>
      </footer>

      {/* Cloud Synchronisation Connecting Loader (Prevents race condition) */}
      {isCloudConnecting && (
        <div className="fixed inset-0 z-[95] bg-[var(--m3-surface)]/85 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-[40px] p-10 shadow-2xl flex flex-col items-center gap-8 text-center max-w-sm w-full"
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.6, 1], 
                    opacity: [0.3, 1, 0.3],
                    backgroundColor: i === 1 ? 'var(--m3-primary)' : 'var(--m3-primary-container)'
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  className="w-3 h-3 rounded-full"
                />
              ))}
            </div>

            <div>
              <h2 className="text-xl font-black text-[var(--m3-on-surface)] tracking-tight">
                Synchronisierung...
              </h2>
              <p className="text-xs font-bold text-[var(--m3-on-surface-variant)] mt-2 opacity-60 uppercase tracking-widest">
                Daten werden geladen
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Screen 1: Netflix-Style Profile Selector */}
      <ProfileSelector
        isOpen={(showProfileSelector || !activeUser) && !isCloudConnecting}
        onClose={() => setShowProfileSelector(false)}
        onOpenSettings={() => {
          setCurrentTab('settings');
          setShowProfileSelector(false);
        }}
        canClose={!!activeUser}
      />

      {/* Work Logging Modal */}
      <LogChoreModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setLogToEdit(null);
        }}
        preselectedTaskId={logModalTaskId}
        logToEdit={logToEdit}
      />

      {/* Task History Modal */}
      <TaskHistoryModal
        taskId={historyTaskId}
        onClose={() => setHistoryTaskId(null)}
        onLogThisTask={(taskId) => handleOpenLogModal(taskId)}
      />

      {/* Admin Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={taskFormModalState.isOpen}
        onClose={() => setTaskFormModalState({ isOpen: false, taskToEdit: null })}
        taskToEdit={taskFormModalState.taskToEdit}
      />

      {/* Comprehensive Onboarding Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
        onComplete={completeTutorial}
      />

      {/* "Was ist neu?" Announcement Modal per Account */}
      <WhatsNewModal
        isOpen={isWhatsNewOpen && !isTutorialOpen}
        onClose={closeWhatsNew}
        onAcknowledge={markCurrentVersionAsSeen}
        activeUserName={activeUser?.name}
      />

      {/* Gamified Task Completion Celebration & Flying Coins to Progress Bar */}
      <ChoreCompletionCelebration
        celebration={rewardCelebration}
        onComplete={clearRewardCelebration}
      />

      {/* Achievement Unlocked Reveal Modal */}
      <AchievementRevealModal
        badge={delayedBadge}
        onClose={clearNewlyUnlockedBadge}
        onSetAsActiveBadge={(bId) => {
          if (activeUser) {
            updateMemberActiveBadge(activeUser.id, () => bId);
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
