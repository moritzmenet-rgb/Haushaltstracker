import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Pin, 
  Utensils, 
  CheckSquare, 
  Layers, 
  ArrowRight,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { haptic } from '../../utils/haptics';

interface AppHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApp: 'fish_and_wish' | 'pinnwand' | 'menuplanner';
  onSelectHubItem: (target: 'fish_and_wish' | 'pinnwand' | 'menuplanner') => void;
}

export const AppHubModal: React.FC<AppHubModalProps> = ({
  isOpen,
  onClose,
  currentApp,
  onSelectHubItem
}) => {
  const { data, pinnwandNotes, menuWishes } = useApp();
  const householdName = data.settings?.household_name || 'Haushalt';

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFwActive = currentApp === 'fish_and_wish';
  const isPinnwandActive = currentApp === 'pinnwand';
  const isMenuActive = currentApp === 'menuplanner';

  const handleSelect = (target: 'fish_and_wish' | 'pinnwand' | 'menuplanner') => {
    haptic.medium();
    onSelectHubItem(target);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Soft backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-md transition-all"
        />

        {/* Center Modal Container with Rectangular Glass Background */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 28, 
            mass: 0.85 
          }}
          className="relative w-full max-w-2xl bg-[var(--m3-surface-container)]/95 backdrop-blur-xl border border-[var(--m3-outline-variant)]/60 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 my-auto text-center overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-lg bg-[var(--m3-surface-container-high)] hover:bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface-variant)] flex items-center justify-center transition cursor-pointer shadow-xs border border-[var(--m3-outline-variant)]/60"
            aria-label="Hub schließen"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Centered Flying Logo Element */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -8, y: -10 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[var(--m3-primary)] border-2 border-white/30 flex items-center justify-center shadow-xl shadow-[var(--m3-primary)]/25 mb-3 relative"
            >
              <span className="text-white font-black text-2xl tracking-tighter">
                F&W
              </span>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-amber-300 drop-shadow-md" />
              </motion.div>
            </motion.div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-xs font-black uppercase tracking-wider text-[var(--m3-primary)] mb-1.5 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              <span>Familien-Zentrale</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] tracking-tight">
              {householdName}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] max-w-sm mx-auto mt-0.5 font-medium">
              Wähle deinen Bereich: Aufgaben, gemeinsame Pinnwand oder Menüplanung.
            </p>
          </div>

          {/* The Three Hub Logos / Module Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 mb-5">
            {/* 1. Fish & Wish Card */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect('fish_and_wish')}
              className={`relative flex flex-col items-center p-4 sm:p-5 rounded-xl border text-center transition-all cursor-pointer group shadow-xs ${
                isFwActive
                  ? 'bg-[var(--m3-primary-container)]/70 border-[var(--m3-primary)] shadow-md shadow-[var(--m3-primary)]/15 ring-2 ring-[var(--m3-primary)]/30'
                  : 'bg-[var(--m3-surface-container-low)] hover:bg-[var(--m3-surface-container-high)] border-[var(--m3-outline-variant)]/60'
              }`}
            >
              {isFwActive && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[var(--m3-primary)] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                  Aktiv
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xl mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
                <span>🎣</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-[var(--m3-on-surface)] tracking-tight">
                Fish & Wish
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-0.5 font-medium leading-snug">
                Aufgaben, Punkte, Belohnungen & Scoreboard
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--m3-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Öffnen</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>

            {/* 2. Pinnwand Card */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect('pinnwand')}
              className={`relative flex flex-col items-center p-4 sm:p-5 rounded-xl border text-center transition-all cursor-pointer group shadow-xs ${
                isPinnwandActive
                  ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/15 ring-2 ring-amber-500/30'
                  : 'bg-[var(--m3-surface-container-low)] hover:bg-[var(--m3-surface-container-high)] border-[var(--m3-outline-variant)]/60'
              }`}
            >
              {isPinnwandActive ? (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                  Aktiv
                </span>
              ) : (pinnwandNotes?.length || 0) > 0 ? (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black shadow-2xs">
                  {pinnwandNotes.length} Zettel
                </span>
              ) : null}
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xl mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
                <Pin className="w-6 h-6 fill-current rotate-12" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[var(--m3-on-surface)] tracking-tight">
                Pinnwand
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-0.5 font-medium leading-snug">
                Notizen, Zettel, Abstimmungen & Listen
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Öffnen</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>

            {/* 3. Menüplanung Card */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect('menuplanner')}
              className={`relative flex flex-col items-center p-4 sm:p-5 rounded-xl border text-center transition-all cursor-pointer group shadow-xs ${
                isMenuActive
                  ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/30'
                  : 'bg-[var(--m3-surface-container-low)] hover:bg-[var(--m3-surface-container-high)] border-[var(--m3-outline-variant)]/60'
              }`}
            >
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                NEU ✨
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xl mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[var(--m3-on-surface)] tracking-tight">
                Menüplanung
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-0.5 font-medium leading-snug">
                Wochen-Speisepläne, Rezepte & Mahlzeiten
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Öffnen</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          </div>

          {/* Quick Footer hint */}
          <div className="pt-3 border-t border-[var(--m3-outline-variant)]/40 flex items-center justify-between text-xs text-[var(--m3-on-surface-variant)]">
            <span className="text-[11px]">
              Tipp: Klicke jederzeit oben auf das <strong>F&W Logo</strong> für diese Zentrale.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-bold hover:text-[var(--m3-primary)] transition underline cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
