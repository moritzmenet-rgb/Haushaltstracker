import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  ChefHat, 
  CalendarDays, 
  BookOpen, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  Pin,
  Clock,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { haptic } from '../../utils/haptics';

interface MenuplannerPlaceholderProps {
  onNavigateToFishAndWish: () => void;
  onNavigateToPinnwand: () => void;
}

export const MenuplannerPlaceholder: React.FC<MenuplannerPlaceholderProps> = ({
  onNavigateToFishAndWish,
  onNavigateToPinnwand
}) => {
  const { data } = useApp();
  const householdName = data.settings?.household_name || 'Haushalt';

  const [hasInteracted, setHasInteracted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleButtonClick = () => {
    haptic.success();
    setHasInteracted(true);
    setFeedbackMessage('Menüplanung aktiviert! Die Speiseplan- und Rezeptfunktionen werden für deinen Haushalt vorbereitet.');
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2 shadow-2xs">
            <Utensils className="w-3.5 h-3.5" />
            <span>Neuer Bereich • Menüplanung</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--m3-on-surface)] flex items-center gap-2">
            <span>Menü- & Speiseplan</span>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
              In Vorbereitung
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-0.5 max-w-xl">
            {householdName} • Plane die Mahlzeiten der Woche, verknüpfe Zutaten mit der Pinnwand und verdiene Punkte beim Kochen.
          </p>
        </div>

        {/* Quick Navigation Back */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToFishAndWish}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] text-xs font-bold border border-[var(--m3-outline-variant)] transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zu Fish & Wish</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToPinnwand}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer shadow-xs"
          >
            <Pin className="w-4 h-4 fill-current rotate-12" />
            <span>Zur Pinnwand</span>
          </button>
        </div>
      </div>

      {/* Interactive Feedback Message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-3 shadow-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hero Card with the Requested Button */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-emerald-500/10 via-[var(--m3-surface-container)] to-[var(--m3-surface-container-low)] border border-emerald-500/25 p-6 sm:p-10 shadow-lg text-center"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-3xl mb-5 shadow-sm">
            <Utensils className="w-10 h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] tracking-tight">
            Was kommt heute auf den Tisch?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-2 font-medium leading-relaxed">
            Hier entsteht die interaktive Menüplanung: Erstelle Wochenpläne, verwalte deine Lieblingsrezepte und übertrage Zutaten direkt auf die Pinnwand.
          </p>

          {/* The Requested Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleButtonClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{hasInteracted ? 'Menüplanung vorgemerkt ✓' : 'Menüplanung starten'}</span>
            </motion.button>

            <button
              type="button"
              onClick={onNavigateToFishAndWish}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] font-bold text-xs border border-[var(--m3-outline-variant)] transition cursor-pointer"
            >
              Zurück zu Aufgaben
            </button>
          </div>
        </div>
      </motion.div>

      {/* Feature Preview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-[var(--m3-on-surface)]">
            Wochen-Speiseplan
          </h3>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 font-medium">
            Montag bis Sonntag im Überblick mit Frühstück, Mittag- und Abendessen.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-[var(--m3-on-surface)]">
            Rezept-Sammlung
          </h3>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 font-medium">
            Familienrezepte mit Zutatenlisten speichern und per Klick in die Woche einplanen.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-[var(--m3-on-surface)]">
            Pinnwand-Einkauf
          </h3>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 font-medium">
            Fehlende Zutaten wandern mit einem Klick auf die Einkaufsliste der Pinnwand.
          </p>
        </div>
      </div>
    </div>
  );
};
