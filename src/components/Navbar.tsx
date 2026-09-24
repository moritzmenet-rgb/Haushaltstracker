import React from 'react';
import { 
  User,
  Settings, 
  LayoutDashboard, 
  CheckSquare, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Plus,
  Cloud,
  Loader2,
  CheckCircle2,
  Sparkles,
  Pin
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';

interface NavbarProps {
  currentTab: 'dashboard' | 'tasks' | 'pinnwand' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'tasks' | 'pinnwand' | 'settings') => void;
  onOpenProfileSelector: () => void;
  onOpenLogModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfileSelector,
  onOpenLogModal
}) => {
  const { 
    data,
    activeUser, 
    isAdmin, 
    theme, 
    toggleTheme, 
    firebaseUser, 
    syncStatus, 
    syncFeedback,
    loginWithGoogle,
    pinnwandNotes
  } = useApp();

  const householdTitle = data.settings?.household_name || 'Haushalt';

  const tabs: Array<{
    id: 'dashboard' | 'tasks' | 'pinnwand' | 'settings';
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Übersicht',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'tasks',
      label: 'Aufgaben',
      icon: <CheckSquare className="w-5 h-5" />
    },
    {
      id: 'pinnwand',
      label: 'Pinnwand',
      icon: <Pin className="w-5 h-5 fill-current rotate-12" />,
      badge: (pinnwandNotes?.length || 0) > 0 ? `${pinnwandNotes.length}` : undefined
    },
    {
      id: 'settings',
      label: isAdmin ? 'Admin' : 'Profil',
      icon: isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />,
      badge: isAdmin ? 'Admin' : undefined
    }
  ];

  return (
    <>
      {/* Material 3 Expressive Top App Bar - Laptop/Desktop Solid Background */}
      <header className="sticky top-0 z-40 bg-[var(--m3-surface)] border-b border-[var(--m3-outline-variant)]/60 transition-colors shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo & Desktop Tabs */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <motion.div 
                whileHover={{ scale: 1.08, rotate: -3 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-11 h-11 rounded-2xl bg-indigo-600 border border-white/20 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 relative overflow-hidden"
              >
                <span className="text-white font-black text-lg tracking-tighter relative z-10">
                  F&W
                </span>
              </motion.div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[var(--m3-on-surface)] leading-tight">
                    Fish & Wish
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs with Iconic M3 Pill Indicator */}
            <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/50 relative">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                      isActive
                        ? 'text-[var(--m3-on-secondary-container)]'
                        : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="m3NavActiveIndicatorDesktop"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 28,
                          mass: 0.8
                        }}
                        className="absolute inset-0 rounded-full bg-[var(--m3-secondary-container)] shadow-sm -z-10"
                      />
                    )}
                    <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-md bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-[9px] font-black uppercase tracking-wider">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Quick Log FAB + Cloud Sync + Theme + Profile Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status / Connect */}
            {firebaseUser ? (
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-2xs ${
                  syncFeedback?.status === 'uploading'
                    ? 'bg-[var(--m3-primary)]/15 border border-[var(--m3-primary)]/40 text-[var(--m3-primary)]'
                    : syncFeedback?.status === 'saved'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : syncStatus === 'connecting'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                }`}
                title={`Live synchronisiert (${firebaseUser.email})`}
              >
                {syncFeedback?.status === 'uploading' || syncStatus === 'connecting' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
                ) : syncFeedback?.status === 'saved' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                )}
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline font-extrabold">
                  {syncFeedback?.status === 'uploading'
                    ? 'Wird hochgeladen...'
                    : syncFeedback?.status === 'saved'
                    ? 'Gesichert ✓'
                    : syncStatus === 'connecting'
                    ? 'Verbinde...'
                    : 'Cloud aktiv'}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-[11px] font-bold border border-[var(--m3-outline-variant)] transition shadow-xs cursor-pointer"
                title="Cloud-Sync in den Einstellungen aktivieren"
              >
                <Cloud className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
                <span>Cloud-Sync</span>
              </button>
            )}

            {/* Quick Action FAB (Desktop Extended) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onOpenLogModal}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--m3-primary-container)] hover:bg-[var(--m3-primary-container)]/90 text-[var(--m3-on-primary-container)] text-xs font-black shadow-md shadow-indigo-600/15 transition-all"
              title="Arbeit erfassen"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Erfassen</span>
            </motion.button>

            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)]/60 transition"
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--m3-on-surface)]" />}
            </motion.button>

            {/* Active User Chip / Switcher */}
            {activeUser ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenProfileSelector}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] rounded-full border border-[var(--m3-outline-variant)] transition group shadow-xs"
                title="Profil wechseln"
              >
                <div
                  style={{ backgroundColor: activeUser.avatar_color }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
                >
                  {getInitials(activeUser.name)}
                </div>
                <div className="text-left hidden xs:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[var(--m3-on-surface)] leading-none">
                      {activeUser.name}
                    </span>
                    {isAdmin && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--m3-on-surface-variant)] font-semibold leading-none block mt-0.5">
                    {activeUser.total_points} Pkt.
                  </span>
                </div>
              </motion.button>
            ) : (
              <button
                onClick={onOpenProfileSelector}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--m3-primary)] text-[var(--m3-on-primary)] rounded-full text-xs font-bold shadow-sm"
              >
                <span>Profil wählen</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Liquid Glass Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
        <nav 
          aria-label="Mobile Navigation"
          className="pointer-events-auto liquid-navbar px-2 py-1.5 flex items-center justify-around w-full max-w-sm transition-all"
        >
          {/* Dashboard Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-95 ${
              currentTab === 'dashboard' 
                ? 'text-[var(--m3-on-surface)]' 
                : 'text-[var(--m3-on-surface-variant)]/70'
            }`}
          >
            <LayoutDashboard className={`transition-transform ${currentTab === 'dashboard' ? 'w-6.5 h-6.5' : 'w-5.5 h-5.5'}`} />
          </button>

          {/* Tasks Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('tasks')}
            className={`flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-95 ${
              currentTab === 'tasks' 
                ? 'text-[var(--m3-on-surface)]' 
                : 'text-[var(--m3-on-surface-variant)]/70'
            }`}
          >
            <CheckSquare className={`transition-transform ${currentTab === 'tasks' ? 'w-6.5 h-6.5' : 'w-5.5 h-5.5'}`} />
          </button>

          {/* Pinnwand Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('pinnwand')}
            className={`flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-95 ${
              currentTab === 'pinnwand' 
                ? 'text-[var(--m3-on-surface)]' 
                : 'text-[var(--m3-on-surface-variant)]/70'
            }`}
          >
            <Pin className={`transition-transform ${currentTab === 'pinnwand' ? 'w-6.5 h-6.5 fill-current rotate-12' : 'w-5.5 h-5.5 rotate-12'}`} />
          </button>

          {/* Settings / Profile Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-95 ${
              currentTab === 'settings' 
                ? 'text-[var(--m3-on-surface)]' 
                : 'text-[var(--m3-on-surface-variant)]/70'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className={`transition-transform ${currentTab === 'settings' ? 'w-6.5 h-6.5' : 'w-5.5 h-5.5'}`} />
            ) : (
              <User className={`transition-transform ${currentTab === 'settings' ? 'w-6.5 h-6.5' : 'w-5.5 h-5.5'}`} />
            )}
          </button>
        </nav>
      </div>
    </>
  );
};
