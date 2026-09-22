import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  KeyRound, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';

export const AccountSettingsTab: React.FC = () => {
  const { activeUser, updateProfile, openTutorial } = useApp();

  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#4F46E5');
  const [weeklyTarget, setWeeklyTarget] = useState(50);
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (activeUser) {
      setName(activeUser.name || '');
      setAvatarColor(activeUser.avatar_color || '#4F46E5');
      setWeeklyTarget(activeUser.weekly_target || 50);
      setPinCode(activeUser.pin_code || '');
    }
  }, [activeUser]);

  if (!activeUser) {
    return (
      <div className="p-8 text-center rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]">
        <User className="w-10 h-10 text-[var(--m3-outline)] mx-auto mb-2" />
        <p className="text-sm font-bold text-[var(--m3-on-surface)]">
          Kein Profil ausgewählt. Bitte wähle zuerst oben rechts dein Profil aus.
        </p>
      </div>
    );
  }

  const PRESET_COLORS = [
    '#4F46E5', // Indigo
    '#059669', // Emerald
    '#E11D48', // Rose
    '#D97706', // Amber
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#64748B'  // Slate
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const trimmedPin = pinCode.trim();
    if (trimmedPin.length > 0 && trimmedPin.length !== 4) {
      setPinError('Der PIN-Code muss genau 4 Ziffern lang sein (oder leer bleiben).');
      return;
    }

    if (trimmedPin.length === 4 && !/^\d{4}$/.test(trimmedPin)) {
      setPinError('Der PIN-Code darf nur aus Ziffern (0-9) bestehen.');
      return;
    }

    updateProfile({
      name: trimmedName,
      avatar_color: avatarColor,
      weekly_target: Number(weeklyTarget) || 50,
      pin_code: trimmedPin.length === 4 ? trimmedPin : undefined
    });

    setSaveSuccess('Dein Profil und deine Sicherheitseinstellungen wurden erfolgreich aktualisiert!');
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4000);
  };

  const handleRemovePin = () => {
    setPinCode('');
    setPinError(null);
    updateProfile({
      pin_code: undefined
    });
    setSaveSuccess('PIN-Code wurde erfolgreich entfernt. Dein Profil ist jetzt ungeschützt.');
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4000);
  };

  const hasPin = Boolean(activeUser.pin_code && activeUser.pin_code.trim().length === 4);

  return (
    <div className="space-y-6">
      {/* Save Success Message */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Profile Form */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[var(--m3-outline-variant)]/60">
          <div className="flex items-center gap-4">
            <div
              style={{ backgroundColor: avatarColor }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md transition-colors"
            >
              {getInitials(name || activeUser.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-[var(--m3-on-surface)]">
                  {name || activeUser.name}
                </h2>
                {activeUser.role === 'admin' ? (
                  <span className="bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Familienmitglied
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                Punkte gesamt: <strong className="text-[var(--m3-primary)] font-black">{activeUser.total_points} Pkt.</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openTutorial}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface-container-high)] hover:bg-[var(--m3-surface-container-highest)] text-[var(--m3-primary)] text-xs font-bold border border-[var(--m3-outline-variant)] transition self-start sm:self-auto cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[var(--m3-primary)]" />
            <span>App-Tour starten</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Dein Name / Anzeigename
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Moritz"
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
              />
            </div>

            {/* Weekly Target */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Persönliches Wochenziel (Punkte)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                step="5"
                required
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
              />
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1 font-medium">
                Standard-Wochenziel für deinen Haushaltsbeitrag.
              </p>
            </div>
          </div>

          {/* Avatar Color Swatches */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-2">
              Profil- & Avatar-Farbe
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    avatarColor === c
                      ? 'ring-3 ring-offset-2 ring-[var(--m3-primary)] scale-110 shadow-sm'
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  aria-label={`Wähle Farbe ${c}`}
                />
              ))}
            </div>
          </div>

          {/* PIN-Code Security Section */}
          <div className="pt-6 border-t border-[var(--m3-outline-variant)]/60">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-[var(--m3-on-surface)]">
                    PIN-Code Sicherheit
                  </h3>
                  {hasPin ? (
                    <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Aktiviert</span>
                    </span>
                  ) : (
                    <span className="bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" />
                      <span>Nicht eingerichtet</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 max-w-lg leading-relaxed">
                  Sichere dein Profil mit einem 4-stelligen PIN-Code. Jedes Mal, wenn jemand beim Profilwechsel dein Profil auswählt, wird dieser Code abgefragt.
                </p>
              </div>

              {hasPin && (
                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="text-xs font-bold text-rose-500 hover:underline shrink-0"
                >
                  PIN entfernen
                </button>
              )}
            </div>

            <div className="max-w-xs space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)]">
                {hasPin ? 'Neuen PIN-Code festlegen' : '4-stelligen PIN-Code eingeben'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="z. B. 1234"
                  value={pinCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinCode(clean);
                    setPinError(null);
                  }}
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-mono tracking-widest text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)]"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center justify-end">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              type="submit"
              className="m3-btn-filled px-6 py-2.5 text-xs font-black inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Änderungen speichern</span>
            </motion.button>
          </div>
        </form>
      </div>

      {/* Tutorial Help Banner */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[var(--m3-on-surface)]">
              Interaktive App-Tour
            </h4>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5 max-w-xl leading-relaxed">
              Möchtest du dir die Funktionsweise der Aufgaben, 3-Sterne-Bewertung, Punkteberechnung und den fairen Wochenübertrag noch einmal ansehen?
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={openTutorial}
          className="m3-btn-tonal px-4 py-2 text-xs font-black shrink-0"
        >
          Tour starten
        </motion.button>
      </div>
    </div>
  );
};
