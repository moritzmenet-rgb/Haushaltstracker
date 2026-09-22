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
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';

interface NavbarProps {
  currentTab: 'dashboard' | 'tasks' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'tasks' | 'settings') => void;
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
    loginWithGoogle,
    isBayernMatchdayActive,
    isFirebaseDisabled
  } = useApp();

  const householdTitle = data.settings?.household_name || 'Haushalt';

  const tabs: Array<{
    id: 'dashboard' | 'tasks' | 'settings';
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
      id: 'settings',
      label: isAdmin ? 'Admin' : 'Profil',
      icon: isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />,
      badge: isAdmin ? 'Admin' : undefined
    }
  ];

  return (
    <>
      {/* Material 3 Expressive Top App Bar */}
      <header className="sticky top-0 z-40 bg-[var(--m3-surface)]/95 backdrop-blur-md border-b border-[var(--m3-outline-variant)]/60 transition-colors">
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
                className="w-10 h-10 rounded-2xl bg-[var(--m3-primary)] text-[var(--m3-on-primary)] flex items-center justify-center font-black text-base shadow-md shadow-indigo-600/20"
              >
                {householdTitle.charAt(0).toUpperCase()}
              </motion.div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[var(--m3-on-surface)] leading-tight">
                    {householdTitle}
                  </span>
                  {isBayernMatchdayActive && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#DC052D] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Bayern Matchday
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-semibold hidden sm:inline-block leading-tight">
                  {isBayernMatchdayActive ? 'Rot • Weiß • Blau (Matchday)' : 'Material 3 Expressive'}
                </span>
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
            {isFirebaseDisabled ? (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                title="Firebase ist aktuell deaktiviert (Test-Modus)"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sync Deaktiviert</span>
              </div>
            ) : firebaseUser ? (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                title={`Live synchronisiert über Firebase (${firebaseUser.email})`}
              >
                {syncStatus === 'connecting' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Cloud Sync</span>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-[11px] font-bold border border-[var(--m3-outline-variant)] transition shadow-xs"
                title="Google Cloud Sync aktivieren"
              >
                <Cloud className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
                <span>Sync</span>
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

      {/* Material 3 Expressive Bottom Navigation Bar for Mobile - Fixed always at bottom */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--m3-surface-container)]/95 backdrop-blur-xl border-t border-[var(--m3-outline-variant)] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
      >
        <div className="max-w-md mx-auto px-2 flex items-center justify-around relative">
          {/* Dashboard Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex-1 py-1 flex flex-col items-center gap-0.5 relative z-10 transition-colors"
          >
            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'dashboard' 
                ? 'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] scale-105 shadow-xs' 
                : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${
              currentTab === 'dashboard' ? 'text-[var(--m3-on-surface)]' : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              Übersicht
            </span>
          </button>

          {/* Tasks Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('tasks')}
            className="flex-1 py-1 flex flex-col items-center gap-0.5 relative z-10 transition-colors"
          >
            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'tasks' 
                ? 'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] scale-105 shadow-xs' 
                : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${
              currentTab === 'tasks' ? 'text-[var(--m3-on-surface)]' : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              Aufgaben
            </span>
          </button>

          {/* Center Expressive Floating Action Button (M3 FAB) */}
          <div className="px-2 -mt-6 relative z-20">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              type="button"
              onClick={onOpenLogModal}
              className="w-13 h-13 rounded-2xl bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-lg shadow-indigo-600/30 flex items-center justify-center border-3 border-[var(--m3-surface-container)]"
              aria-label="Arbeit erfassen"
              title="Arbeit erfassen"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </motion.button>
          </div>

          {/* Settings / Profile Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className="flex-1 py-1 flex flex-col items-center gap-0.5 relative z-10 transition-colors"
          >
            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'settings' 
                ? 'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] scale-105 shadow-xs' 
                : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-bold ${
              currentTab === 'settings' ? 'text-[var(--m3-on-surface)]' : 'text-[var(--m3-on-surface-variant)]'
            }`}>
              {isAdmin ? 'Admin' : 'Profil'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
