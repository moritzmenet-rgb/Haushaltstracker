import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home, Target, Calendar, Check, Sparkles, Building2, HelpCircle, Trophy, Shield, Clock, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FamilySettings } from '../../types';

export const GeneralSettingsTab: React.FC = () => {
  const { data, updateSettings } = useApp();
  const settings = data.settings;

  const [householdName, setHouseholdName] = useState(settings.household_name || 'Unser Haushalt');
  const [weeklyTarget, setWeeklyTarget] = useState<number>(settings.default_weekly_target || 50);
  const [weekStart, setWeekStart] = useState<'monday' | 'sunday' | 'saturday'>(settings.week_start_day || 'monday');
  const [autoReset, setAutoReset] = useState(settings.auto_reset_enabled || false);
  const [resetDay, setResetDay] = useState(settings.scheduled_reset_day ?? 6); // Sat
  const [resetHour, setResetHour] = useState(settings.scheduled_reset_hour ?? 23);
  const [resetMinute, setResetMinute] = useState(settings.scheduled_reset_minute ?? 59);
  const [savedBadge, setSavedBadge] = useState<string | null>(null);

  const showSaved = (msg: string) => {
    setSavedBadge(msg);
    setTimeout(() => setSavedBadge(null), 3000);
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!householdName.trim()) return;
    await updateSettings({ household_name: householdName.trim() });
    showSaved('Haushaltsname gespeichert!');
  };

  const handleSaveTarget = async (newVal: number) => {
    setWeeklyTarget(newVal);
    await updateSettings({ default_weekly_target: newVal });
    showSaved('Standard-Wochenziel aktualisiert!');
  };

  const handleSaveWeekStart = async (day: 'monday' | 'sunday' | 'saturday') => {
    setWeekStart(day);
    await updateSettings({ week_start_day: day });
    showSaved('Wochenstart-Tag gespeichert!');
  };

  const handleSaveAutoReset = async (updates: Partial<FamilySettings>) => {
    await updateSettings(updates);
    showSaved('Reset-Planer aktualisiert!');
  };

  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const NAME_PRESETS = ['Familie Menet', 'WG Sonnenschein', 'Villa Kunterbunt', 'Unser Haushalt', 'Home Sweet Home'];
  const TARGET_PRESETS = [
    { label: '30 Pkt.', sub: 'Gemütlich', val: 30 },
    { label: '50 Pkt.', sub: 'Standard', val: 50 },
    { label: '75 Pkt.', sub: 'Aktiv', val: 75 },
    { label: '100 Pkt.', sub: 'Fleißig', val: 100 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      {/* Toast Notification */}
      {savedBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-lg"
        >
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{savedBadge}</span>
        </motion.div>
      )}

      {/* 1. Haushaltsname */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Haushaltsname
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Erscheint in der Kopfzeile, auf allen Geräten und im App-Titel.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="space-y-3 mt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              maxLength={40}
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="z. B. Familie Menet..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="m3-btn-filled px-6 py-2.5 text-xs font-black"
            >
              Namen speichern
            </motion.button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[var(--m3-outline)]">Vorschläge:</span>
            {NAME_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={async () => {
                  setHouseholdName(p);
                  await updateSettings({ household_name: p });
                  showSaved(`Name auf "${p}" gesetzt!`);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  householdName === p
                    ? 'm3-chip-selected'
                    : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 2. Globales Basis-Wochenziel */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Standard-Wochenziel für neue Mitglieder
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Das Standard-Ziel in Punkten für neu angelegte Familienmitglieder sowie Basis für die Roll-Over-Formel.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="flex-1 pr-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
                  Zielwert einstellen:
                </span>
                <span className="text-base font-black text-[var(--m3-primary)]">
                  {weeklyTarget} Punkte
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={weeklyTarget}
                onChange={(e) => handleSaveTarget(Number(e.target.value))}
                className="w-full m3-slider cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--m3-outline)] font-bold mt-1">
                <span>10 Pkt. (Min)</span>
                <span>100 Pkt.</span>
                <span>200 Pkt. (Max)</span>
              </div>
            </div>

            <div className="border-l border-[var(--m3-outline-variant)] pl-4 flex flex-col items-center">
              <span className="text-[10px] uppercase font-black text-[var(--m3-outline)] mb-1">Direktwert</span>
              <input
                type="number"
                min="10"
                max="300"
                step="5"
                value={weeklyTarget}
                onChange={(e) => handleSaveTarget(Math.max(10, Math.min(300, Number(e.target.value))))}
                className="w-20 px-2 py-1.5 text-center font-black text-sm rounded-xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
              />
            </div>
          </div>

          {/* Target Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TARGET_PRESETS.map((tp) => {
              const isSelected = weeklyTarget === tp.val;
              return (
                <motion.button
                  key={tp.val}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleSaveTarget(tp.val)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'm3-chip-selected shadow-xs'
                      : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  <div className="font-black text-sm text-[var(--m3-on-surface)]">
                    {tp.label}
                  </div>
                  <div className="text-[11px] text-[var(--m3-on-surface-variant)]">
                    {tp.sub}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Wochentag für Wochen-Zyklus */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Start des Haushalts-Wochenzyklus
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Legt fest, an welchem Tag die Woche für die Auswertung und den Roll-Over beginnt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            { id: 'monday', label: 'Montag', sub: 'Klassischer Wochenstart' },
            { id: 'sunday', label: 'Sonntag', sub: 'Wochenende als Start' },
            { id: 'saturday', label: 'Samstag', sub: 'Großputztag als Start' }
          ].map((d) => {
            const isSelected = weekStart === d.id;
            return (
              <motion.button
                key={d.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleSaveWeekStart(d.id as any)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'm3-chip-selected shadow-xs'
                    : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-sm text-[var(--m3-on-surface)]">
                    {d.label}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[var(--m3-primary)] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[var(--m3-on-surface-variant)]">
                  {d.sub}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. Automatisierter Wochen-Reset */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
                Automatisierter Wochen-Reset
              </h2>
              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                Plane den genauen Zeitpunkt, zu dem die Punkte archiviert und Ziele neu berechnet werden.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !autoReset;
              setAutoReset(next);
              handleSaveAutoReset({ auto_reset_enabled: next });
            }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${autoReset ? 'bg-[var(--m3-primary)]' : 'bg-[var(--m3-surface-container-highest)]'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoReset ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {autoReset && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-6 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day Selection */}
              <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--m3-outline)] mb-2">Tag des Resets</label>
                <select
                  value={resetDay}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setResetDay(val);
                    handleSaveAutoReset({ scheduled_reset_day: val });
                  }}
                  className="w-full bg-transparent text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--m3-outline)] mb-2">Uhrzeit (HH:MM)</label>
                <div className="flex items-center gap-2">
                   <select
                    value={resetHour}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResetHour(val);
                      handleSaveAutoReset({ scheduled_reset_hour: val });
                    }}
                    className="bg-transparent text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="font-bold text-[var(--m3-outline)]">:</span>
                  <select
                    value={resetMinute}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResetMinute(val);
                      handleSaveAutoReset({ scheduled_reset_minute: val });
                    }}
                    className="bg-transparent text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none"
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
               <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                 Der Reset wird beim ersten Öffnen der App nach dem gewählten Zeitpunkt ausgeführt. Falls niemand die App öffnet, wird der Reset nachgeholt, sobald sich ein Mitglied anmeldet.
               </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
