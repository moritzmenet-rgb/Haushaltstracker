import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound, RefreshCw, Smartphone, Monitor, Tablet, Trash2, ShieldCheck, ShieldAlert,
  AlertTriangle, Check, Loader2, Lock, Unlock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmModal } from '../ConfirmModal';
import {
  AccessConfig, UnlockedDevice, CODE_LENGTH, formatCode, generateCode, getAccessConfig, isValidCode,
  normalizeCode, revokeDevice, saveAccessCode, setDeviceLockEnabled, setEnforcement, subscribeDevices
} from '../../services/deviceAccess';

const card = 'p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm';

const DeviceIcon: React.FC<{ type: string }> = ({ type }) =>
  type === 'Mobile' ? <Smartphone className="w-5 h-5" /> : type === 'Tablet' ? <Tablet className="w-5 h-5" /> : <Monitor className="w-5 h-5" />;

/**
 * Admin (Moritz only): family code, unlocked devices and the database protection switch.
 */
export const DeviceAccessTab: React.FC = () => {
  const { isMoritzAccount, data, loginWithGoogle } = useApp();
  const [config, setConfig] = useState<AccessConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [devices, setDevices] = useState<UnlockedDevice[]>([]);
  const [draftCode, setDraftCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<UnlockedDevice | null>(null);
  const [confirmEnforce, setConfirmEnforce] = useState(false);

  const lockEnabled = Boolean(data.settings.device_lock_enabled);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const reloadConfig = async () => {
    try {
      const c = await getAccessConfig();
      setConfig(c);
      setConfigError(null);
    } catch (e: any) {
      setConfigError(e?.code === 'permission-denied'
        ? 'Kein Zugriff. Die neuen Datenbank-Regeln sind vermutlich noch nicht veröffentlicht.'
        : 'Konnte die Einstellungen nicht laden.');
    }
  };

  useEffect(() => {
    if (!isMoritzAccount) return;
    reloadConfig();
    const unsub = subscribeDevices(setDevices, () => setDevices([]));
    return () => unsub();
  }, [isMoritzAccount]);

  const run = async (key: string, fn: () => Promise<void>, success: string) => {
    setBusy(key);
    try {
      await fn();
      showToast(success);
      await reloadConfig();
    } catch (e: any) {
      showToast(e?.code === 'permission-denied' ? 'Kein Zugriff (Regeln noch nicht aktiv?)' : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(null);
    }
  };

  if (!isMoritzAccount) {
    return (
      <div className={`${card} text-center`}>
        <Lock className="w-10 h-10 text-[var(--m3-outline)] mx-auto mb-3" />
        <h2 className="text-base font-black text-[var(--m3-on-surface)]">Nur für Moritz</h2>
        <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1.5 max-w-sm mx-auto">
          Geräte und Familien-Code können nur mit dem Admin-Google-Konto verwaltet werden.
        </p>
        <button
          type="button"
          onClick={() => loginWithGoogle().catch(() => {})}
          className="mt-4 px-4 py-2 rounded-xl bg-[var(--m3-primary)] text-white text-xs font-bold"
        >
          Mit Google anmelden
        </button>
      </div>
    );
  }

  const cleanDraft = normalizeCode(draftCode);
  const draftValid = isValidCode(cleanDraft);
  const hasCode = Boolean(config?.code);

  return (
    <div className="space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] shadow-lg"
        >
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </motion.div>
      )}

      {/* Intro */}
      <div className={card}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--m3-on-surface)] mb-1">Geräte-Schutz</h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-xl leading-relaxed">
              Jedes Gerät wird einmal mit dem Familien-Code freigeschaltet. Fremde mit dem Link sehen nur die Code-Abfrage.
              Reihenfolge: <strong>1.</strong> Code festlegen → <strong>2.</strong> Code-Abfrage einschalten →
              alle Geräte freischalten → <strong>3.</strong> Datenbank-Schutz scharf schalten.
            </p>
          </div>
        </div>
        {configError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{configError}</span>
          </div>
        )}
      </div>

      {/* 1. Family code */}
      <div className={card}>
        <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-[var(--m3-primary)]" /> 1. Familien-Code
        </h3>
        <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4">
          {hasCode
            ? 'Aktueller Code – das kommt auf den Zettel in der Küche:'
            : 'Noch kein Code festgelegt. Erzeuge einen oder tippe einen eigenen ein (8 Zeichen, Buchstaben und Zahlen).'}
        </p>
        {hasCode && (
          <div className="mb-4 inline-block px-5 py-3 rounded-2xl bg-[var(--m3-surface)] border-2 border-dashed border-[var(--m3-primary)] font-mono text-2xl font-black tracking-[0.3em] text-[var(--m3-on-surface)]">
            {formatCode(config!.code!)}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            value={formatCode(draftCode)}
            onChange={e => setDraftCode(normalizeCode(e.target.value).slice(0, CODE_LENGTH))}
            placeholder={hasCode ? 'Neuer Code' : 'XXXX-XXXX'}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] font-mono font-bold tracking-[0.2em] uppercase text-sm text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
          />
          <button
            type="button"
            onClick={() => setDraftCode(generateCode())}
            className="px-4 py-2.5 rounded-2xl bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Zufällig erzeugen
          </button>
          <button
            type="button"
            disabled={!draftValid || busy !== null}
            onClick={() => run('code', async () => { await saveAccessCode(cleanDraft); setDraftCode(''); }, 'Familien-Code gespeichert')}
            className="px-4 py-2.5 rounded-2xl bg-[var(--m3-primary)] text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {busy === 'code' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Speichern
          </button>
        </div>
        {hasCode && (
          <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-2">
            Ein neuer Code gilt nur für neue Geräte. Bereits freigeschaltete Geräte bleiben freigeschaltet – sperre sie unten einzeln.
          </p>
        )}
      </div>

      {/* 2. Device prompt */}
      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-[var(--m3-primary)]" /> 2. Code-Abfrage auf Geräten
            </h3>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-md">
              Wenn eingeschaltet, fragt jedes noch nicht freigeschaltete Gerät einmal nach dem Familien-Code.
            </p>
          </div>
          <button
            type="button"
            disabled={!hasCode || busy !== null}
            onClick={() => run('lock', () => setDeviceLockEnabled(!lockEnabled), lockEnabled ? 'Code-Abfrage ausgeschaltet' : 'Code-Abfrage eingeschaltet')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 ${lockEnabled ? 'bg-emerald-600 text-white' : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] border border-[var(--m3-outline-variant)]'}`}
          >
            {lockEnabled ? 'Eingeschaltet' : 'Ausgeschaltet'}
          </button>
        </div>
      </div>

      {/* Devices */}
      <div className={card}>
        <h3 className="text-sm font-black text-[var(--m3-on-surface)] mb-1">Freigeschaltete Geräte ({devices.length})</h3>
        <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4">
          Dein Google-Konto braucht keine Freischaltung. Verlorenes Gerät? Einfach sperren.
        </p>
        {devices.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--m3-on-surface-variant)] rounded-2xl border border-dashed border-[var(--m3-outline-variant)]">
            Noch keine Geräte freigeschaltet.
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map(d => (
              <div key={d.uid} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--m3-surface-container)] text-[var(--m3-primary)] flex items-center justify-center shrink-0">
                    <DeviceIcon type={d.device_type} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--m3-on-surface)] truncate">{d.label}</div>
                    <div className="text-[11px] text-[var(--m3-on-surface-variant)]">
                      {d.device_type || 'Gerät'} · seit {d.created_at ? new Date(d.created_at).toLocaleDateString('de-DE') : '?'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRevokeTarget(d)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 border border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sperren
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Enforce */}
      <div className={`${card} ${config?.enforce ? 'border-emerald-500/40' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2 mb-1">
              {config?.enforce ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
              3. Datenbank-Schutz {config?.enforce ? 'aktiv' : 'aus'}
            </h3>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-md">
              {config?.enforce
                ? 'Nur freigeschaltete Geräte und dein Google-Konto können Daten lesen oder ändern.'
                : 'Erst einschalten, wenn alle Familien-Geräte oben in der Liste stehen. Danach sind nicht freigeschaltete Geräte komplett ausgesperrt.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!hasCode || !lockEnabled || busy !== null}
            onClick={() => config?.enforce
              ? run('enforce', () => setEnforcement(false), 'Datenbank-Schutz ausgeschaltet')
              : setConfirmEnforce(true)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 ${config?.enforce ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
          >
            {config?.enforce ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {config?.enforce ? 'Scharf' : 'Scharf schalten'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title="Gerät sperren?"
        message={`"${revokeTarget?.label}" muss danach den Familien-Code neu eingeben.`}
        confirmLabel="Sperren"
        cancelLabel="Abbrechen"
        isDanger
        onConfirm={() => {
          const t = revokeTarget;
          setRevokeTarget(null);
          if (t) run('revoke', () => revokeDevice(t.uid), `"${t.label}" gesperrt`);
        }}
        onCancel={() => setRevokeTarget(null)}
      />

      <ConfirmModal
        isOpen={confirmEnforce}
        title="Datenbank-Schutz scharf schalten?"
        message={`Alle Geräte, die nicht in der Liste stehen (${devices.length} freigeschaltet), verlieren sofort den Zugriff, bis sie den Code eingeben. Du kannst den Schutz jederzeit wieder ausschalten.`}
        confirmLabel="Scharf schalten"
        cancelLabel="Abbrechen"
        onConfirm={() => {
          setConfirmEnforce(false);
          run('enforce', () => setEnforcement(true), 'Datenbank-Schutz ist aktiv');
        }}
        onCancel={() => setConfirmEnforce(false)}
      />
    </div>
  );
};
