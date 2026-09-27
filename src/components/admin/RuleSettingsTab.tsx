import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Star, 
  Calculator, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Sliders, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Info,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculatePoints } from '../../utils';
import { ConfirmModal } from '../ConfirmModal';
import { FamilySettings } from '../../types';

export const RuleSettingsTab: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    getWeeklyRollOverPreview, 
    executeWeeklyReset 
  } = useApp();
  const settings = data.settings;

  // Star Multipliers state
  const [star1, setStar1] = useState<number>(settings.star_multiplier_1 ?? 50);
  const [star2, setStar2] = useState<number>(settings.star_multiplier_2 ?? 75);
  const [star3, setStar3] = useState<number>(settings.star_multiplier_3 ?? 100);

  // Rollover factors state
  const [surplusFactor, setSurplusFactor] = useState<number>(settings.rollover_surplus_factor ?? 100);
  const [deficitFactor, setDeficitFactor] = useState<number>(settings.rollover_deficit_factor ?? 100);
  const [minTarget, setMinTarget] = useState<number>(settings.rollover_min_target ?? 10);
  const [maxTarget, setMaxTarget] = useState<number>(settings.rollover_max_target ?? 200);

  // Sync state if settings update from Cloud
  useEffect(() => {
    if (typeof settings.star_multiplier_1 === 'number') setStar1(settings.star_multiplier_1);
    if (typeof settings.star_multiplier_2 === 'number') setStar2(settings.star_multiplier_2);
    if (typeof settings.star_multiplier_3 === 'number') setStar3(settings.star_multiplier_3);
    if (typeof settings.rollover_surplus_factor === 'number') setSurplusFactor(settings.rollover_surplus_factor);
    if (typeof settings.rollover_deficit_factor === 'number') setDeficitFactor(settings.rollover_deficit_factor);
    if (typeof settings.rollover_min_target === 'number') setMinTarget(settings.rollover_min_target);
    if (typeof settings.rollover_max_target === 'number') setMaxTarget(settings.rollover_max_target);
  }, [
    settings.star_multiplier_1,
    settings.star_multiplier_2,
    settings.star_multiplier_3,
    settings.rollover_surplus_factor,
    settings.rollover_deficit_factor,
    settings.rollover_min_target,
    settings.rollover_max_target
  ]);

  // Debounce timers to prevent Firestore write rate violations during continuous dragging
  const debounceTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const debounceUpdate = (key: string, updates: Partial<FamilySettings>, delay: number = 350) => {
    if (debounceTimerRef.current[key]) {
      clearTimeout(debounceTimerRef.current[key]);
    }
    debounceTimerRef.current[key] = setTimeout(() => {
      updateSettings(updates);
      showToast('Einstellung gesichert ✓');
    }, delay);
  };

  const flushUpdate = (key: string, updates: Partial<FamilySettings>) => {
    if (debounceTimerRef.current[key]) {
      clearTimeout(debounceTimerRef.current[key]);
    }
    updateSettings(updates);
    showToast('Einstellung gesichert ✓');
  };

  // Live calculator test base
  const [testBasePoints, setTestBasePoints] = useState<number>(20);

  // Reset modal & messages
  const [showResetModal, setShowResetModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleUpdateStarMultiplier = (starNumber: 1 | 2 | 3, value: number, immediate: boolean = false) => {
    const val = Math.max(10, Math.min(250, value));
    const key = `star_${starNumber}`;
    const updateKey = `star_multiplier_${starNumber}` as keyof FamilySettings;
    const updates = { [updateKey]: val };

    if (starNumber === 1) setStar1(val);
    else if (starNumber === 2) setStar2(val);
    else setStar3(val);

    if (immediate) {
      flushUpdate(key, updates);
    } else {
      debounceUpdate(key, updates);
    }
  };

  const handleUpdateRollover = (updates: {
    surplus?: number;
    deficit?: number;
    min?: number;
    max?: number;
  }, immediate: boolean = false) => {
    const newUpdates: any = {};
    if (updates.surplus !== undefined) {
      const val = Math.max(0, Math.min(200, updates.surplus));
      setSurplusFactor(val);
      newUpdates.rollover_surplus_factor = val;
    }
    if (updates.deficit !== undefined) {
      const val = Math.max(0, Math.min(200, updates.deficit));
      setDeficitFactor(val);
      newUpdates.rollover_deficit_factor = val;
    }
    if (updates.min !== undefined) {
      const val = Math.max(5, Math.min(100, updates.min));
      setMinTarget(val);
      newUpdates.rollover_min_target = val;
    }
    if (updates.max !== undefined) {
      const val = Math.max(50, Math.min(500, updates.max));
      setMaxTarget(val);
      newUpdates.rollover_max_target = val;
    }

    if (immediate) {
      flushUpdate('rollover', newUpdates);
    } else {
      debounceUpdate('rollover', newUpdates);
    }
  };

  const handleExecuteConfirmedReset = () => {
    executeWeeklyReset();
    setShowResetModal(false);
    showToast('Wochenzyklus zurückgesetzt & neue Wochenziele übertragen!');
  };

  const rollOverPreviews = getWeeklyRollOverPreview();

  // Test calculations with live multipliers
  const simSettings = {
    star_multiplier_1: star1,
    star_multiplier_2: star2,
    star_multiplier_3: star3
  };
  const simPoints1 = calculatePoints(testBasePoints, 1, simSettings);
  const simPoints2 = calculatePoints(testBasePoints, 2, simSettings);
  const simPoints3 = calculatePoints(testBasePoints, 3, simSettings);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      {/* Toast */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-lg backdrop-blur-md"
        >
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successToast}</span>
        </motion.div>
      )}

      {/* 1. STERNE-MULTIPLIKATOREN */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Sterne-Multiplikatoren & Qualitäts-Bonus
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Bestimme millimetergenau, wie viele Prozent der Basispunkte für 1, 2 und 3 Sterne vergeben werden.
            </p>
          </div>
        </div>

        {/* 3 Slider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* 1 Star */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-[var(--m3-on-surface)]">1 Stern</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--m3-surface-container)] px-2 py-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                <input
                  type="number"
                  min="10"
                  max="250"
                  step="5"
                  value={star1}
                  onChange={(e) => handleUpdateStarMultiplier(1, Number(e.target.value), false)}
                  onBlur={() => handleUpdateStarMultiplier(1, star1, true)}
                  className="w-10 text-center font-black text-xs text-[var(--m3-on-surface)] bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-bold text-[var(--m3-outline)]">% ({star1 / 100}x)</span>
              </div>
            </div>
            
            {/* Enhanced Bonus Information */}
            <div className="p-2.5 rounded-xl bg-[var(--m3-surface-container)] text-[11px] space-y-1">
              <span className="font-bold text-[var(--m3-on-surface)] block">Basis-Erledigung:</span>
              <p className="text-[var(--m3-on-surface-variant)] leading-snug">
                Aufgabe zügig und funktional abgeschlossen, kein Qualitätsnachweis erforderlich.
              </p>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={star1}
              onChange={(e) => handleUpdateStarMultiplier(1, Number(e.target.value), false)}
              onPointerUp={() => handleUpdateStarMultiplier(1, star1, true)}
              onTouchEnd={() => handleUpdateStarMultiplier(1, star1, true)}
              onKeyUp={() => handleUpdateStarMultiplier(1, star1, true)}
              className="w-full m3-slider cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--m3-outline)] font-bold">
              <span>10%</span>
              <span>50% (Standard)</span>
              <span>100%</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[var(--m3-outline-variant)]/60">
              {[25, 50, 75, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleUpdateStarMultiplier(1, val, true)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                    star1 === val 
                      ? 'bg-[var(--m3-primary)] text-white' 
                      : 'bg-[var(--m3-surface-container)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <span className="ml-auto text-[10px] text-[var(--m3-outline)] font-medium">
                10 Pkt. = <strong className="text-[var(--m3-on-surface)]">{calculatePoints(10, 1, simSettings)} Pkt.</strong>
              </span>
            </div>
          </div>

          {/* 2 Stars */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-[var(--m3-on-surface)] ml-1">2 Sterne</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--m3-surface-container)] px-2 py-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                <input
                  type="number"
                  min="20"
                  max="250"
                  step="5"
                  value={star2}
                  onChange={(e) => handleUpdateStarMultiplier(2, Number(e.target.value), false)}
                  onBlur={() => handleUpdateStarMultiplier(2, star2, true)}
                  className="w-10 text-center font-black text-xs text-[var(--m3-on-surface)] bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-bold text-[var(--m3-outline)]">% ({star2 / 100}x)</span>
              </div>
            </div>

            {/* Enhanced Bonus Information */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
              <span className="font-black text-amber-700 dark:text-amber-300 block">Gründlich (+Bonus):</span>
              <p className="text-[var(--m3-on-surface-variant)] leading-snug">
                Besonders sorgfältig erledigt. <strong className="text-[var(--m3-on-surface)]">Erfordert 1 Qualitätskriterium</strong> als Nachweis im Protokoll.
              </p>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={star2}
              onChange={(e) => handleUpdateStarMultiplier(2, Number(e.target.value), false)}
              onPointerUp={() => handleUpdateStarMultiplier(2, star2, true)}
              onTouchEnd={() => handleUpdateStarMultiplier(2, star2, true)}
              onKeyUp={() => handleUpdateStarMultiplier(2, star2, true)}
              className="w-full m3-slider cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--m3-outline)] font-bold">
              <span>20%</span>
              <span>75% (Standard)</span>
              <span>150%</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[var(--m3-outline-variant)]/60">
              {[50, 75, 100, 125].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleUpdateStarMultiplier(2, val, true)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                    star2 === val 
                      ? 'bg-[var(--m3-primary)] text-white' 
                      : 'bg-[var(--m3-surface-container)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <span className="ml-auto text-[10px] text-[var(--m3-outline)] font-medium">
                10 Pkt. = <strong className="text-[var(--m3-on-surface)]">{calculatePoints(10, 2, simSettings)} Pkt.</strong>
              </span>
            </div>
          </div>

          {/* 3 Stars */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-[var(--m3-on-surface)] ml-1">3 Sterne</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-xl border border-emerald-500/20">
                <input
                  type="number"
                  min="50"
                  max="250"
                  step="5"
                  value={star3}
                  onChange={(e) => handleUpdateStarMultiplier(3, Number(e.target.value), false)}
                  onBlur={() => handleUpdateStarMultiplier(3, star3, true)}
                  className="w-10 text-center font-black text-xs text-emerald-700 dark:text-emerald-300 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">% ({star3 / 100}x)</span>
              </div>
            </div>

            {/* Enhanced Bonus Information */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-1">
              <span className="font-black text-emerald-700 dark:text-emerald-300 block">Perfekt (+Maximaler Bonus):</span>
              <p className="text-[var(--m3-on-surface-variant)] leading-snug">
                Überragend und makellos! <strong className="text-[var(--m3-on-surface)]">Erfordert 2 Qualitätskriterien</strong> als Highlights im Protokoll.
              </p>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={star3}
              onChange={(e) => handleUpdateStarMultiplier(3, Number(e.target.value), false)}
              onPointerUp={() => handleUpdateStarMultiplier(3, star3, true)}
              onTouchEnd={() => handleUpdateStarMultiplier(3, star3, true)}
              onKeyUp={() => handleUpdateStarMultiplier(3, star3, true)}
              className="w-full m3-slider cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--m3-outline)] font-bold">
              <span>50%</span>
              <span>100% (Standard)</span>
              <span>200%</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[var(--m3-outline-variant)]/60">
              {[75, 100, 125, 150].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleUpdateStarMultiplier(3, val, true)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                    star3 === val 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-[var(--m3-surface-container)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <span className="ml-auto text-[10px] text-[var(--m3-outline)] font-medium">
                10 Pkt. = <strong className="text-[var(--m3-on-surface)]">{calculatePoints(10, 3, simSettings)} Pkt.</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Simulator Preview */}
        <div className="mt-6 p-5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--m3-primary)]" />
              <span className="text-xs font-black text-[var(--m3-on-surface)]">
                Live-Simulation: Punktausbeute für eine Aufgabe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--m3-on-surface-variant)] font-bold">Test-Basispunkte:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={testBasePoints}
                onChange={(e) => setTestBasePoints(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2.5 py-1 text-center text-xs font-black rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--m3-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 shadow-2xs">
              <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-bold block mb-1">⭐ 1 Stern</span>
              <span className="text-base font-black text-[var(--m3-primary)]">
                {simPoints1} Pkt.
              </span>
              <span className="text-[10px] text-[var(--m3-outline)] font-semibold block mt-0.5">
                ({star1}% von {testBasePoints})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 shadow-2xs">
              <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-bold block mb-1">⭐⭐ 2 Sterne</span>
              <span className="text-base font-black text-[var(--m3-primary)]">
                {simPoints2} Pkt.
              </span>
              <span className="text-[10px] text-[var(--m3-outline)] font-semibold block mt-0.5">
                ({star2}% von {testBasePoints})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 shadow-2xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mb-1">⭐⭐⭐ 3 Sterne</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {simPoints3} Pkt.
              </span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold block mt-0.5">
                ({star3}% von {testBasePoints})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMISCHE ROLL-OVER ENGINE */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Dynamische Roll-Over Engine & Faktoren
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Berechnet Wochenziele für die Folgewoche: Überschüsse belohnen, Rückstände mitnehmen.
            </p>
          </div>
        </div>

        {/* Formula Display Box */}
        <div className="p-5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] text-xs text-[var(--m3-on-surface)] mt-4 mb-6">
          <div className="font-mono text-[var(--m3-primary)] font-black text-xs sm:text-sm mb-2 flex items-center gap-2">
            <span>Neues Ziel = Basis-Ziel + (Altes Ziel - Erreichte Punkte) × Faktor</span>
          </div>
          <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
            • <strong className="text-[var(--m3-on-surface)]">Überschuss:</strong> Wer mehr erledigt, erhält nächste Woche ein reduziertes Ziel als Belohnung.<br />
            • <strong className="text-[var(--m3-on-surface)]">Defizit:</strong> Wer weniger erledigt, nimmt den Rückstand in die neue Woche mit.
          </p>
        </div>

        {/* Factor Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Surplus Factor */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[var(--m3-on-surface)] flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                Überschuss-Übertrag
              </span>
              <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="5"
                  value={surplusFactor}
                  onChange={(e) => handleUpdateRollover({ surplus: Number(e.target.value) }, false)}
                  onBlur={() => handleUpdateRollover({ surplus: surplusFactor }, true)}
                  className="w-10 text-center font-black text-xs text-emerald-700 dark:text-emerald-300 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">%</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Wieviel Prozent des Überschusses wird als Entlastung abgezogen? (100% = 1:1)
            </p>
            <input
              type="range"
              min="0"
              max="150"
              step="10"
              value={surplusFactor}
              onChange={(e) => handleUpdateRollover({ surplus: Number(e.target.value) }, false)}
              onPointerUp={() => handleUpdateRollover({ surplus: surplusFactor }, true)}
              onTouchEnd={() => handleUpdateRollover({ surplus: surplusFactor }, true)}
              className="w-full m3-slider cursor-pointer"
            />
          </div>

          {/* Deficit Factor */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[var(--m3-on-surface)] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Defizit-Übertrag
              </span>
              <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="5"
                  value={deficitFactor}
                  onChange={(e) => handleUpdateRollover({ deficit: Number(e.target.value) }, false)}
                  onBlur={() => handleUpdateRollover({ deficit: deficitFactor }, true)}
                  className="w-10 text-center font-black text-xs text-amber-700 dark:text-amber-300 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">%</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Wieviel Prozent des Rückstands wird aufgeschlagen? (100% = 1:1)
            </p>
            <input
              type="range"
              min="0"
              max="150"
              step="10"
              value={deficitFactor}
              onChange={(e) => handleUpdateRollover({ deficit: Number(e.target.value) }, false)}
              onPointerUp={() => handleUpdateRollover({ deficit: deficitFactor }, true)}
              onTouchEnd={() => handleUpdateRollover({ deficit: deficitFactor }, true)}
              className="w-full m3-slider cursor-pointer"
            />
          </div>

          {/* Min Target Bound */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-[var(--m3-on-surface)] block">
                Minimales Wochenziel
              </span>
              <span className="text-[11px] text-[var(--m3-on-surface-variant)]">
                Untergrenze für stark entlastete Wochen.
              </span>
            </div>
            <input
              type="number"
              min="5"
              max="50"
              value={minTarget}
              onChange={(e) => handleUpdateRollover({ min: Math.max(5, Number(e.target.value)) }, false)}
              onBlur={() => handleUpdateRollover({ min: minTarget }, true)}
              className="w-20 px-2 py-1.5 text-center text-xs font-black rounded-xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)]"
            />
          </div>

          {/* Max Target Bound */}
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-[var(--m3-on-surface)] block">
                Maximales Wochenziel
              </span>
              <span className="text-[11px] text-[var(--m3-on-surface-variant)]">
                Obergrenze gegen Frustration bei Rückstand.
              </span>
            </div>
            <input
              type="number"
              min="50"
              max="500"
              value={maxTarget}
              onChange={(e) => handleUpdateRollover({ max: Math.max(50, Number(e.target.value)) }, false)}
              onBlur={() => handleUpdateRollover({ max: maxTarget }, true)}
              className="w-20 px-2 py-1.5 text-center text-xs font-black rounded-xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)]"
            />
          </div>
        </div>

        {/* Live Roll-over Preview Table */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)]">
              Live-Vorschau: Alle Mitglieder bei sofortigem Reset
            </span>
            <span className="text-[11px] text-[var(--m3-primary)] font-black">
              Berechnet in Echtzeit
            </span>
          </div>

          <div className="divide-y divide-[var(--m3-outline-variant)]/60 border border-[var(--m3-outline-variant)] rounded-2xl overflow-hidden bg-[var(--m3-surface)] shadow-2xs">
            {rollOverPreviews.length === 0 ? (
              <div className="p-5 text-center text-xs text-[var(--m3-outline)]">
                Noch keine Mitglieder vorhanden.
              </div>
            ) : (
              rollOverPreviews.map((p) => (
                <div
                  key={p.memberId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--m3-on-surface)]">
                      {p.memberName}
                    </span>
                    <span className="text-[var(--m3-outline)] text-[11px]">
                      (Erreicht: {p.achievedPoints} / Soll: {p.oldTarget} Pkt.)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.difference > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{p.difference} Pkt. Rückstand
                      </span>
                    ) : p.difference < 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {Math.abs(p.difference)} Pkt. Vorsprung 🎉
                      </span>
                    ) : (
                      <span className="text-[var(--m3-outline)] font-medium">Ziel exakt erreicht</span>
                    )}

                    <div className="flex items-center gap-1.5 font-bold pl-2 border-l border-[var(--m3-outline-variant)]">
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                      <span className="text-[var(--m3-primary)] text-sm font-black">
                        {p.newTarget} Pkt.
                      </span>
                      <span className="text-[10px] text-[var(--m3-outline)] font-normal">neu</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trigger Reset Button */}
        <div className="pt-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowResetModal(true)}
            className="m3-btn-filled px-6 py-3 text-xs font-black inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Wochen-Reset jetzt manuell ausführen</span>
          </motion.button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Wochen-Reset wirklich ausführen?"
        message="Dadurch wird die neue Woche gestartet. Die erreichten Punkte der aktuellen Woche werden archiviert und die neuen individuellen Wochenziele anhand der Roll-Over-Formel berechnet und gesetzt."
        confirmLabel="Ja, Reset ausführen"
        cancelLabel="Abbrechen"
        onConfirm={handleExecuteConfirmedReset}
        onCancel={() => setShowResetModal(false)}
        isDanger={false}
      />
    </motion.div>
  );
};
