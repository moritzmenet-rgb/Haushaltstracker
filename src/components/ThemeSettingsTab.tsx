import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Sparkles, CheckCircle2, Star, CheckSquare, Shield, Trophy, Calendar, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLOR_THEMES } from '../theme';
import { ColorTheme } from '../types';

export const ThemeSettingsTab: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    isAdmin, 
    colorTheme, 
    effectiveTheme, 
    setColorTheme 
  } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectTheme = (themeId: ColorTheme) => {
    setColorTheme(themeId);
    setFeedback(`Farbkonzept "${COLOR_THEMES[themeId].name}" wurde aktiviert!`);
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const themesList = Object.values(COLOR_THEMES);

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro Header */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--m3-on-surface)] mb-1">
              Farbkonzepte zur Auswahl
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-xl leading-relaxed">
              Wähle dein bevorzugtes Farbschema für den Haushalt Tracker.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themesList.map((t) => {
          const isSelected = effectiveTheme === t.id || colorTheme === t.id;

          return (
            <motion.div
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => handleSelectTheme(t.id)}
              className={`cursor-pointer rounded-[24px] p-6 border-2 transition-all flex flex-col justify-between shadow-sm ${
                isSelected
                  ? 'bg-[var(--m3-surface-container-high)] ring-4 ring-[var(--m3-primary)]/20'
                  : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)] hover:border-[var(--m3-outline)]'
              }`}
              style={{
                borderColor: isSelected ? t.primaryHex : undefined
              }}
            >
              <div>
                {/* Header of Card */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full shadow-xs"
                      style={{ backgroundColor: t.primaryHex }}
                    />
                    <div>
                      <h3 className="text-base font-black text-[var(--m3-on-surface)]">
                        {t.name}
                      </h3>
                      <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)]">
                        {t.subtitle}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <span 
                      className="text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-xs"
                      style={{ backgroundColor: t.primaryHex }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Aktiv</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[var(--m3-outline)]">
                      Auswählen
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4 leading-relaxed">
                  {t.description}
                </p>

                {/* Color swatches */}
                <div className="flex items-center gap-2 mb-4">
                  {[t.primaryHex, t.hoverHex, t.dotColor, t.borderHex].map((color: string, idx: number) => (
                    <div
                      key={idx}
                      className="h-5 flex-1 rounded-lg shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Mini Preview Component */}
                <div className="p-3.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--m3-on-surface)]">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" style={{ color: t.primaryHex }} />
                      Vorschau-Badge
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-black text-white"
                      style={{ backgroundColor: t.primaryHex }}
                    >
                      +30 Pkt.
                    </span>
                  </div>
                  <div className="w-full bg-[var(--m3-surface-container)] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: '65%', backgroundColor: t.primaryHex }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Playful Interactive Animation Showcase */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--m3-on-surface)]">
                Angenehm federnde Button-Animationen
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                Sanfte, physikalische Spring- und Bounce-Effekte bei Klicks und Tap-Gesten für ein lebendiges, aufgeräumtes Gefühl ohne störende Partikel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-[var(--m3-primary)] hover:bg-[var(--m3-primary-hover)] text-white text-xs font-black shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Hier testen!</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Bonus-Tap ⭐</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
