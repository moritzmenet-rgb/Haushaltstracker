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
  Pin,
  Trophy,
  Utensils,
  Calendar,
  Lightbulb,
  BookOpen,
  GitFork,
  LayoutGrid,
  Vote,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';
import { UserBadge } from './UserBadge';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';
import { haptic } from '../utils/haptics';

export type MainAppType = 'fish_and_wish' | 'pinnwand' | 'menuplanner';
export type FishAndWishTab = 'dashboard' | 'tasks' | 'abzeichen' | 'settings';
export type PinnwandTab = 'canvas' | 'stream' | 'polls' | 'mine';
export type MenuplannerTab = 'week' | 'ideas' | 'recipes';

interface NavbarProps {
  currentApp: MainAppType;
  currentFishTab: FishAndWishTab;
  currentPinnwandTab: PinnwandTab;
  currentMenuTab: MenuplannerTab;
  onSelectFishTab: (tab: FishAndWishTab) => void;
  onSelectPinnwandTab: (tab: PinnwandTab) => void;
  onSelectMenuTab: (tab: MenuplannerTab) => void;
  onOpenProfileSelector: () => void;
  onOpenQuickAction: () => void;
  onOpenHub: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentApp,
  currentFishTab,
  currentPinnwandTab,
  currentMenuTab,
  onSelectFishTab,
  onSelectPinnwandTab,
  onSelectMenuTab,
  onOpenProfileSelector,
  onOpenQuickAction,
  onOpenHub
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
    pinnwandNotes,
    menuWishes,
    easterEggClickCount,
    triggerEasterEggClick
  } = useApp();

  // Count strictly the achievements unlocked by the current member
  const myUnlockedCount = React.useMemo(() => {
    if (!activeUser) return 0;
    return ACHIEVEMENTS_DATA.filter(b => {
      if (b.section === 'trophies') {
        return data.trophyOwners?.[b.id] === activeUser.id;
      }
      return Boolean(activeUser.unlocked_badges?.[b.id]);
    }).length;
  }, [activeUser, data.trophyOwners]);

  // Count active polls in Pinnwand
  const activePollsCount = React.useMemo(() => {
    return pinnwandNotes.filter(n => Boolean(n.poll)).length;
  }, [pinnwandNotes]);

  // Count my notes in Pinnwand
  const myNotesCount = React.useMemo(() => {
    if (!activeUser) return 0;
    return pinnwandNotes.filter(n => n.authorId === activeUser.id).length;
  }, [pinnwandNotes, activeUser]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    triggerEasterEggClick();
    onOpenHub();
  };

  // 1. TABS CONFIGURATION FOR FISH & WISH
  const fishAndWishTabs: Array<{
    id: FishAndWishTab;
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
      id: 'abzeichen',
      label: 'Abzeichen',
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      badge: myUnlockedCount > 0 ? `${myUnlockedCount}` : undefined
    },
    {
      id: 'settings',
      label: isAdmin ? 'Admin' : 'Profil',
      icon: isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />,
      badge: isAdmin ? 'Admin' : undefined
    }
  ];

  // 2. TABS CONFIGURATION FOR PINNWAND
  const pinnwandTabs: Array<{
    id: PinnwandTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'canvas',
      label: 'Pinnwand',
      icon: <GitFork className="w-5 h-5 text-rose-500" />
    },
    {
      id: 'stream',
      label: 'Themen-Fokus',
      icon: <LayoutGrid className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'polls',
      label: 'Abstimmungen',
      icon: <Vote className="w-5 h-5 text-amber-500" />,
      badge: activePollsCount > 0 ? `${activePollsCount}` : undefined
    },
    {
      id: 'mine',
      label: 'Meine Pins',
      icon: <Pin className="w-5 h-5 text-rose-600 fill-current" />,
      badge: myNotesCount > 0 ? `${myNotesCount}` : undefined
    }
  ];

  // 3. TABS CONFIGURATION FOR MENÜPLANUNG
  const menuplannerTabs: Array<{
    id: MenuplannerTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'week',
      label: 'Wochenplan',
      icon: <Calendar className="w-5 h-5 text-emerald-500" />
    },
    {
      id: 'ideas',
      label: 'Wünsche',
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      badge: menuWishes.length > 0 ? `${menuWishes.length}` : undefined
    },
    {
      id: 'recipes',
      label: 'Rezepte',
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />
    }
  ];

  // Dynamic branding information depending on active app
  const brandConfig = React.useMemo(() => {
    switch (currentApp) {
      case 'pinnwand':
        return {
          title: 'Pinnwand',
          shortTitle: 'PIN',
          subTitle: 'Themen & Rote Fäden',
          bgClass: 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/25',
          accentColor: 'text-rose-500',
          quickActionLabel: 'Anpinnen',
          quickActionBg: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-600/25',
          icon: <Pin className="w-5 h-5 fill-current rotate-12" />
        };
      case 'menuplanner':
        return {
          title: 'Menüplanung',
          shortTitle: 'MENÜ',
          subTitle: 'Speiseplan & Rezepte',
          bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/25',
          accentColor: 'text-emerald-500',
          quickActionLabel: 'Wunsch / Plan',
          quickActionBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25',
          icon: <Utensils className="w-5 h-5" />
        };
      case 'fish_and_wish':
      default:
        return {
          title: 'Fish & Wish',
          shortTitle: 'F&W',
          subTitle: data.settings?.household_name || 'Haushalt',
          bgClass: 'bg-[var(--m3-primary)] shadow-[var(--m3-primary)]/25',
          accentColor: 'text-[var(--m3-primary)]',
          quickActionLabel: 'Erfassen',
          quickActionBg: 'bg-[var(--m3-primary-container)] hover:bg-[var(--m3-primary-container)]/90 text-[var(--m3-on-primary-container)] shadow-indigo-600/15',
          icon: <LayoutDashboard className="w-5 h-5" />
        };
    }
  }, [currentApp, data.settings?.household_name]);

  return (
    <>
      {/* Material 3 Expressive Top App Bar */}
      <header className="sticky top-0 z-40 bg-[var(--m3-surface)]/90 backdrop-blur-md border-b border-[var(--m3-outline-variant)]/40 transition-colors shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Desktop Tabs */}
          <div className="flex items-center gap-6">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group select-none"
              title="Klicke auf das Logo für die App-Zentrale (Bereich wechseln)"
            >
              <motion.div 
                whileHover={{ scale: 1.08, rotate: -3 }}
                whileTap={{ scale: 0.88, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className={`w-11 h-11 rounded-2xl border border-white/20 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden text-white ${brandConfig.bgClass}`}
              >
                <span className="font-black text-xs sm:text-sm tracking-tighter relative z-10">
                  {brandConfig.shortTitle}
                </span>
                {easterEggClickCount > 0 && easterEggClickCount < 10 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-amber-500/30 flex items-center justify-center pointer-events-none"
                  />
                )}
              </motion.div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[var(--m3-on-surface)] leading-tight group-hover:text-[var(--m3-primary)] transition-colors">
                    {brandConfig.title}
                  </span>
                  {/* Subtle Hub switcher indicator arrow */}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] group-hover:bg-[var(--m3-primary-container)] group-hover:text-[var(--m3-on-primary-container)] font-bold transition flex items-center gap-1">
                    <Compass className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Wechseln</span>
                  </span>
                  {easterEggClickCount > 0 && easterEggClickCount < 10 && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black"
                    >
                      🥚 {easterEggClickCount}/10
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-[var(--m3-on-surface-variant)] leading-tight">
                  {brandConfig.subTitle}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Active App Adaptive) */}
            {currentApp === 'fish_and_wish' && (
              <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/50 relative">
                {fishAndWishTabs.map((tab, idx) => {
                  const isActive = currentFishTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + idx * 0.04 }}
                      onClick={() => {
                        haptic.selection();
                        onSelectFishTab(tab.id);
                      }}
                      className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
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
                      {tab.badge !== undefined && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-md bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          {tab.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            )}

            {currentApp === 'menuplanner' && (
              <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/50 relative">
                {menuplannerTabs.map((tab, idx) => {
                  const isActive = currentMenuTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + idx * 0.04 }}
                      onClick={() => {
                        haptic.selection();
                        onSelectMenuTab(tab.id);
                      }}
                      className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
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
                      {tab.badge !== undefined && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-md bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          {tab.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Controls: Quick Action FAB + Cloud Sync + Theme + Profile Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status */}
            <div 
              onClick={() => {
                if (currentApp === 'fish_and_wish') {
                  onSelectFishTab('settings');
                } else {
                  onOpenHub();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-2xs cursor-pointer ${
                syncFeedback?.status === 'uploading'
                  ? 'bg-[var(--m3-primary)]/15 border border-[var(--m3-primary)]/40 text-[var(--m3-primary)]'
                  : syncFeedback?.status === 'saved'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
              }`}
              title={firebaseUser ? `Live synchronisiert (${firebaseUser.email || 'Online'})` : 'Live synchronisiert (Online-First Haushalt)'}
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

            {/* Contextual Quick Action FAB (Desktop Extended) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => {
                haptic.medium();
                onOpenQuickAction();
              }}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${brandConfig.quickActionBg}`}
              title={brandConfig.quickActionLabel}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{brandConfig.quickActionLabel}</span>
            </motion.button>

            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)]/60 transition cursor-pointer"
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
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] rounded-full border border-[var(--m3-outline-variant)] transition group shadow-xs cursor-pointer"
                title="Profil wechseln"
              >
                <div
                  style={{ backgroundColor: activeUser.avatar_color }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
                >
                  {getInitials(activeUser.name)}
                </div>
                <div className="text-left hidden xs:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--m3-on-surface)] leading-none">
                      {activeUser.name}
                    </span>
                    <UserBadge badgeId={activeUser.active_badge_id} size="xs" />
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--m3-primary)] text-[var(--m3-on-primary)] rounded-full text-xs font-bold shadow-sm cursor-pointer"
              >
                <span>Profil wählen</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Material 3 Expressive Mobile Bottom Navigation Bar (Shown for Fish & Wish and Menüplanung) */}
      {currentApp !== 'pinnwand' && (
        <div className="md:hidden fixed bottom-3 inset-x-3 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
          <nav 
            aria-label="Mobile Navigation"
            className="pointer-events-auto liquid-navbar px-2 py-1.5 flex items-center justify-around w-full max-w-md shadow-2xl rounded-[28px] border border-[var(--m3-outline-variant)]/60 bg-[var(--m3-surface-container)]/95 backdrop-blur-xl transition-all"
          >
            {/* 1. Mobile Fish & Wish Tabs */}
            {currentApp === 'fish_and_wish' && fishAndWishTabs.map((tab, idx) => {
              const isActive = currentFishTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.03 }}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onSelectFishTab(tab.id);
                  }}
                  className={`relative flex-1 py-1.5 px-1 min-h-[50px] flex flex-col items-center justify-center transition-all active:scale-92 cursor-pointer ${
                    isActive 
                      ? 'text-[var(--m3-primary)] font-black' 
                      : 'text-[var(--m3-on-surface-variant)]/75 hover:text-[var(--m3-on-surface)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="m3NavActiveMobileFish"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-[var(--m3-primary-container)]/60 border border-[var(--m3-primary)]/20 -z-10 shadow-xs"
                    />
                  )}

                  <div className="relative">
                    <span className={`transition-transform duration-200 block ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {tab.icon}
                    </span>
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-[8px] font-black leading-none shadow-xs">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-extrabold tracking-tight mt-0.5 leading-tight truncate max-w-[62px]">
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}

            {/* 2. Mobile Menüplanung Tabs */}
            {currentApp === 'menuplanner' && menuplannerTabs.map((tab, idx) => {
              const isActive = currentMenuTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.03 }}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onSelectMenuTab(tab.id);
                  }}
                  className={`relative flex-1 py-1.5 px-1 min-h-[50px] flex flex-col items-center justify-center transition-all active:scale-92 cursor-pointer ${
                    isActive 
                      ? 'text-emerald-600 dark:text-emerald-400 font-black' 
                      : 'text-[var(--m3-on-surface-variant)]/75 hover:text-[var(--m3-on-surface)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="m3NavActiveMobileMenu"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 -z-10 shadow-xs"
                    />
                  )}

                  <div className="relative">
                    <span className={`transition-transform duration-200 block ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {tab.icon}
                    </span>
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[8px] font-black leading-none shadow-xs">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-extrabold tracking-tight mt-0.5 leading-tight truncate max-w-[62px]">
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}

          </nav>
        </div>
      )}
    </>
  );
};

