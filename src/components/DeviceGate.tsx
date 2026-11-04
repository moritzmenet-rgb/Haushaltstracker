import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldCheck, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CODE_LENGTH, formatCode, isValidCode, normalizeCode } from '../services/deviceAccess';

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

/**
 * Full-screen gate shown once per device: unlock with the family code from the kitchen.
 * The real protection is in the Firestore rules – this screen only collects the code.
 */
export const DeviceGate: React.FC = () => {
  const { unlockDevice, deviceAccessStatus, loginWithGoogle } = useApp();
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const clean = normalizeCode(code);
  const canSubmit = isValidCode(clean) && !busy && cooldown === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = await unlockDevice(clean, label);
    setBusy(false);
    if (result === 'ok') return;
    if (result === 'wrong_code') {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setCooldown(COOLDOWN_SECONDS);
        setAttempts(0);
        setError(`Zu viele Versuche. Bitte warte ${COOLDOWN_SECONDS} Sekunden.`);
      } else {
        setError('Der Code stimmt nicht. Bitte prüfe ihn noch einmal.');
      }
    } else {
      setError('Verbindung fehlgeschlagen. Bitte prüfe das Internet und versuche es erneut.');
    }
  };

  const noAuth = deviceAccessStatus === 'no-auth';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[var(--m3-surface)] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-sm my-auto rounded-3xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/60 shadow-2xl p-6 sm:p-8 text-center"
      >
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[var(--m3-primary)] flex items-center justify-center shadow-xl shadow-[var(--m3-primary)]/25">
          <span className="text-white font-black text-2xl tracking-tighter">F&amp;W</span>
        </div>

        <h1 className="text-xl font-black text-[var(--m3-on-surface)] tracking-tight">Gerät freischalten</h1>

        {noAuth ? (
          <>
            <p className="mt-2 text-sm text-[var(--m3-on-surface-variant)]">
              Die Anmeldung ist gerade nicht möglich. Bitte gib Moritz Bescheid.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 rounded-2xl bg-[var(--m3-primary)] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              Erneut versuchen
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 space-y-4 text-left">
            <p className="text-sm text-center text-[var(--m3-on-surface-variant)]">
              Gib einmalig den <strong>Familien-Code</strong> ein. Du findest ihn auf dem Zettel in der Küche.
            </p>

            <div>
              <label htmlFor="family-code" className="block text-[11px] font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Familien-Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[var(--m3-outline)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="family-code"
                  value={formatCode(code)}
                  onChange={e => { setCode(normalizeCode(e.target.value).slice(0, CODE_LENGTH)); setError(null); }}
                  placeholder="XXXX-XXXX"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  maxLength={CODE_LENGTH + 1}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-lg font-mono font-bold tracking-[0.25em] uppercase text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="device-label" className="block text-[11px] font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Name für dieses Gerät <span className="normal-case font-semibold">(optional)</span>
              </label>
              <input
                id="device-label"
                value={label}
                onChange={e => setLabel(e.target.value.slice(0, 60))}
                placeholder="z. B. Handy Felix"
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-semibold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
              />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}{cooldown > 0 ? ` (${cooldown} s)` : ''}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-2xl bg-[var(--m3-primary)] text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{busy ? 'Wird geprüft …' : 'Gerät freischalten'}</span>
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => { loginWithGoogle().catch(() => {}); }}
          className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] transition"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Admin? Mit Google anmelden</span>
        </button>
      </motion.div>
    </div>
  );
};
