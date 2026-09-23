import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TaskCatalog } from './components/TaskCatalog';
import { AdminSettings } from './components/AdminSettings';
import { ProfileSelector } from './components/ProfileSelector';
import { CloudOnboarding } from './components/CloudOnboarding';
import { LogChoreModal } from './components/LogChoreModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TutorialModal } from './components/TutorialModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { SyncFeedbackBanner } from './components/SyncFeedbackBanner';
import { SyncOverlay } from './components/SyncOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaskItem, ChoreLog } from './types';

const MainContent: React.FC = () => {
  const { isAppLoaded, isAuthResolving, data, firebaseUser, activeUser, isTutorialOpen, closeTutorial, completeTutorial, syncStatus } = useApp();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'settings'>('dashboard');
  
  // Decide if we should show the cloud onboarding screen
  // (Empty local data + not logged in = likely new family member or fresh start)
  const [showCloudOnboarding, setShowCloudOnboarding] = useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);

  const isDataEmpty = Object.keys(data.members).length === 0;

  useEffect(() => {
    // Show onboarding if:
    // 1. User has not dismissed onboarding
    // 2. App is loaded
    // 3. Local data is empty
    // 4. We are NOT resolving auth (definitively logged out)
    // 5. We are NOT connecting (definitively offline)
    const isConnecting = firebaseUser && syncStatus === 'connecting';
    
    // Strict check: Only show if we know for sure the user is not logged in and not about to be
    if (!dismissedOnboarding && isAppLoaded && !isAuthResolving && isDataEmpty && !isConnecting && !firebaseUser) {
      setShowCloudOnboarding(true);
    } else {
      setShowCloudOnboarding(false);
    }
  }, [isAppLoaded, isAuthResolving, isDataEmpty, firebaseUser, syncStatus, dismissedOnboarding]);

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

  // Open profile selector automatically if no user is active
  useEffect(() => {
    if (!activeUser) {
      setShowProfileSelector(true);
    } else {
      // Whenever the active user changes (and is not null), always reset to dashboard
      setCurrentTab('dashboard');
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28 sm:pb-20">
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

        {currentTab === 'settings' && <AdminSettings />}
      </main>

      {/* Footer (Desktop only so mobile bar has clean full-height canvas) */}
      <footer className="hidden sm:block py-6 border-t border-[var(--m3-outline-variant)] text-center text-xs text-[var(--m3-on-surface-variant)]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Haushalt PWA • Gamifiziertes Familien-Haushaltsmanagement</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileSelector(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition font-medium"
            >
              Profil wechseln
            </button>
            <span>•</span>
            <span className="text-emerald-500 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Lokal & Tab-Sync aktiv
            </span>
          </div>
        </div>
      </footer>

      {/* Screen 0: Cloud Onboarding (For fresh installs / family joins) */}
      {showCloudOnboarding && (
        <CloudOnboarding 
          onLocalSetup={() => {
            setDismissedOnboarding(true);
            setShowCloudOnboarding(false);
          }} 
        />
      )}

      {/* Screen 1: Netflix-Style Profile Selector */}
      <ProfileSelector
        isOpen={(showProfileSelector || !activeUser) && !showCloudOnboarding}
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
