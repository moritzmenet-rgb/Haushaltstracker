import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  Star, 
  CheckSquare, 
  Calendar,
  Flame,
  Zap,
  Leaf,
  Sun
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLOR_THEMES, getDailyThemeData } from '../theme';
import { ColorTheme } from '../types';

export const ThemeSettingsTab: React.FC = () => {
  const { 
    colorTheme, 
    effectiveTheme, 
    setColorTheme 
  } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Live calculation of today's daily theme
  const dailyThemeInfo = useMemo(() => getDailyThemeData(), []);

  const handleSelectTheme = (themeId: ColorTheme) => {
    setColorTheme(themeId);
    setFeedback(`Farbkonzept "${COLOR_THEMES[themeId].name}" wurde aktiviert!`);
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const themesList = Object.values(COLOR_THEMES);
  const dailyTheme = themesList.find(t => t.id === 'daily') || COLOR_THEMES.daily;
  const regularThemes = themesList.filter(t => t.id !== 'daily');

  const isDailyActive = effectiveTheme === 'daily' || colorTheme === 'daily';

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
              Farbkonzepte & Tägliches Dynamic Design
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-xl leading-relaxed">
              Wähle dein bevorzugtes Farbschema für den Haushalt Tracker – oder aktiviere den <strong>Täglichen Zauber</strong>, der dir jeden Morgen ein einzigartiges, frisches Design verspricht!
            </p>
          </div>
        </div>
      </div>

      {/* 1. HERO SPECIAL: TÄGLICH WECHSELNDES FARBKONZEPT */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={() => handleSelectTheme('daily')}
        className={`cursor-pointer rounded-[32px] p-6 sm:p-7 border-2 transition-all relative overflow-hidden shadow-lg ${
          isDailyActive
            ? 'bg-gradient-to-br from-[var(--m3-surface-container-high)] to-[var(--m3-surface-container)] ring-4 ring-amber-400/30 border-amber-400'
            : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)]'
        }`}
      >
        {/* Decorative background glow */}
        <div 
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: dailyTheme.primaryHex }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0"
              style={{ backgroundColor: dailyTheme.primaryHex }}
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[var(--m3-on-surface)]">
                  {dailyTheme.name}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Jeden Tag anders</span>
                </span>
              </div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Garantiert: Nie zweimal das Gleiche! • Berechnet für {dailyThemeInfo.formattedDate}</span>
              </p>
            </div>
          </div>

          <div>
            {isDailyActive ? (
              <span 
                className="text-white text-xs font-black px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md"
                style={{ backgroundColor: dailyTheme.primaryHex }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aktiviert</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-4 py-2 rounded-full bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container-high)] transition shadow-xs">
                Aktivieren ✨
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[var(--m3-on-surface-variant)] mb-5 leading-relaxed relative z-10 max-w-3xl">
          {dailyTheme.description} Anhand des Kalendertages generiert ein deterministischer Alchemie-Algorithmus jeden Morgen um Mitternacht ein neues, atemberaubendes Farberlebnis mit voller Leuchtkraft und optimalem Kontrast.
        </p>

        {/* Color swatches for today */}
        <div className="space-y-2 mb-4 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--m3-outline)]">
            Heutige Farbpalette ({dailyThemeInfo.formattedDate}):
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              dailyThemeInfo.scale[50],
              dailyThemeInfo.scale[200],
              dailyThemeInfo.scale[400],
              dailyThemeInfo.scale[500],
              dailyThemeInfo.scale[600],
              dailyThemeInfo.scale[700],
              dailyThemeInfo.scale[900]
            ].map((color, idx) => (
              <div
                key={idx}
                className="h-7 flex-1 rounded-xl shadow-xs transition-transform hover:scale-105 border border-black/5"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Mini Preview Box */}
        <div className="p-3.5 rounded-2xl bg-[var(--m3-surface)]/80 backdrop-blur-xs border border-[var(--m3-outline-variant)]/60 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dailyTheme.primaryHex }} />
            <span>Morgen erwartet dich automatisch der nächste Farbton!</span>
          </div>
          <span 
            className="text-[11px] font-black px-2.5 py-1 rounded-lg text-white"
            style={{ backgroundColor: dailyTheme.primaryHex }}
          >
            Täglicher Zauber
          </span>
        </div>
      </motion.div>

      {/* 2. REGULAR THEMES SECTION */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-3 flex items-center gap-2">
          <span>Kuratierte Farbkonzepte ({regularThemes.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularThemes.map((t) => {
            const isSelected = (effectiveTheme === t.id || colorTheme === t.id) && !isDailyActive;

            // Visual Icons for themes
            let ThemeIcon = Sparkles;
            if (t.id === 'cyberpunk') ThemeIcon = Zap;
            else if (t.id === 'sunset') ThemeIcon = Flame;
            else if (t.id === 'forest') ThemeIcon = Leaf;
            else if (t.id === 'amber') ThemeIcon = Sun;

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
                        className="w-8 h-8 rounded-xl shadow-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: t.primaryHex }}
                      >
                        <ThemeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-black text-[var(--m3-on-surface)]">
                            {t.name}
                          </h4>
                          {['cyberpunk', 'sunset', 'forest'].includes(t.id) && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                              Neu
                            </span>
                          )}
                        </div>
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
                        <span>Vorschau-Badge</span>
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
      </div>
    </div>
  );
};
