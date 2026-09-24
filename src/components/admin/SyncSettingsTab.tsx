import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Cloud, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Database, 
  LogOut, 
  Loader2, 
  Share2, 
  Copy, 
  Check, 
  DollarSign, 
  UploadCloud,
  HelpCircle,
  FileDown,
  FileUp,
  AlertCircle,
  Mail,
  UserPlus2,
  X,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SyncSettingsTab: React.FC = () => {
  const { 
    firebaseUser, 
    firebaseError,
    loginWithGoogle, 
    loginWithApple,
    logoutFirebase, 
    uploadAllToCloud,
    resetFirebaseCompletely,
    exportDataJSON,
    importDataJSON,
    data,
    updateSettings
  } = useApp();

  const isAppleUser = firebaseUser?.providerData?.some(p => p.providerId === 'apple.com');
  const providerName = isAppleUser ? 'Apple-ID' : 'Google-Konto';

  const [newEmail, setNewEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleResetFirebaseCompletely = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    try {
      await resetFirebaseCompletely();
      setUploadSuccess('Cloud & Haushalt erfolgreich komplett geleert!');
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setUploadSuccess('Fehler beim Zurücksetzen: ' + (err.message || String(err)));
      setTimeout(() => setUploadSuccess(null), 5000);
    } finally {
      setIsResetting(false);
    }
  };

  const handleForceResync = async () => {
    setIsResetting(true);
    try {
      localStorage.removeItem('household_chore_tracker_data_v5');
      localStorage.removeItem('household_chore_tracker_data_v3');
      localStorage.removeItem('household_chore_active_user_id');
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  const handleUploadAll = async () => {
    setIsUploading(true);
    try {
      await uploadAllToCloud();
      setUploadSuccess('Alle Haushaltsdaten erfolgreich in die Cloud synchronisiert!');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    
    const currentEmails = data.settings.allowed_emails || [];
    if (currentEmails.includes(newEmail.trim().toLowerCase())) {
      setNewEmail('');
      return;
    }
    
    updateSettings({
      allowed_emails: [...currentEmails, newEmail.trim().toLowerCase()]
    });
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    const currentEmails = data.settings.allowed_emails || [];
    updateSettings({
      allowed_emails: currentEmails.filter(e => e !== email)
    });
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      {/* 1. STATUS & AUTH CARD */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
              firebaseUser
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]'
            }`}>
              <Cloud className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
                  Firebase Cloud-Synchronisation
                </h2>
                {firebaseUser ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live & Aktiv
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-xs font-bold">
                    Lokaler Speicher
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                {firebaseUser
                  ? `Verbunden mit ${providerName}: ${firebaseUser.email || (isAppleUser ? 'Apple-ID verknüpft' : firebaseUser.uid)}`
                  : 'Aktuell sind deine Daten lokal im Browser gespeichert. Melde dich mit Google oder Apple an für automatische Live-Synchronisation.'}
              </p>
            </div>
          </div>

          {/* Action Login / Logout */}
          <div>
            {firebaseUser ? (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="m3-btn-filled px-4 py-2.5 text-xs font-black inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>In Cloud pushen</span>
                </motion.button>

                <button
                  type="button"
                  onClick={logoutFirebase}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[var(--m3-surface)] hover:bg-rose-500/10 text-[var(--m3-on-surface-variant)] hover:text-rose-500 text-xs font-bold border border-[var(--m3-outline-variant)] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Abmelden</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loginWithGoogle}
                  className="m3-btn-filled px-4 py-2 text-xs font-black inline-flex items-center gap-2 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Mit Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loginWithApple}
                  className="px-4 py-2 rounded-2xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-black inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.65-7.85-11.87-14.34-6.3-9.69-11.05-20.91-14.25-33.67-3.2-12.76-4.8-24.89-4.8-36.38 0-14.61 3.59-26.69 10.77-36.23 7.18-9.55 16.27-14.43 27.27-14.65 4.89 0 10.37 1.25 16.44 3.75 6.07 2.5 10.15 3.8 12.24 3.91 1.74-.11 6.04-1.46 12.91-4.04 6.87-2.58 12.44-3.72 16.71-3.41 12.82.88 23.01 5.92 30.58 15.13-11.09 6.74-16.53 15.98-16.32 27.72.22 9.24 3.7 17.06 10.45 23.48 6.74 6.41 14.88 10.11 24.43 11.09-2.17 6.74-4.89 13.91-8.15 21.52zM119.22 31.84c0-7.39 2.66-14.45 7.99-21.19 5.33-6.74 11.96-10.65 19.89-11.74.22 1.09.33 2.17.33 3.26 0 7.28-2.77 14.34-8.32 21.19-5.54 6.85-12.17 10.65-19.89 11.41z"/>
                  </svg>
                  <span>Mit Apple</span>
                </motion.button>
              </div>
            )}
          </div>

          {firebaseUser && (
            <div className="mt-4 pt-4 border-t border-[var(--m3-outline-variant)] flex flex-wrap items-center gap-4">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isResetting}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cloud komplett leeren</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                    Wirklich alle Daten in Firebase löschen?
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFirebaseCompletely}
                    disabled={isResetting}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[11px] hover:bg-rose-700 transition"
                  >
                    {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ja, leeren'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 rounded-lg bg-[var(--m3-surface)] text-[var(--m3-on-surface)] font-bold text-[11px]"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleForceResync}
                disabled={isResetting}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--m3-on-surface-variant)] hover:text-rose-500 transition flex items-center gap-1.5 cursor-pointer"
              >
                Lokalen Cache leeren & neu laden
              </button>
            </div>
          )}
        </div>

        {firebaseError === 'unauthorized-domain' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-700 dark:text-rose-400"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-rose-500 text-white shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider">Domain nicht autorisiert</h3>
            </div>
            
            <p className="text-xs leading-relaxed mb-4 font-bold opacity-90">
              Firebase blockiert den Login von dieser Seite, weil die Adresse noch nicht in deiner "Whitelist" steht.
            </p>

            <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-rose-500/20 shadow-xs space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black opacity-60">1. Kopiere diese Adresse:</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
                  <code className="text-xs font-mono font-bold flex-1 truncate">{window.location.hostname}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      setUploadSuccess('Domain kopiert!');
                      setTimeout(() => setUploadSuccess(null), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-[var(--m3-primary)] text-white hover:opacity-90 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black opacity-60">2. In Firebase Console einfügen:</label>
                <a 
                  href="https://console.firebase.google.com/project/household-411e7/authentication/settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-highest)] transition group"
                >
                  <span className="text-xs font-bold underline">Einstellungen öffnen</span>
                  <Share2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                </a>
                <p className="text-[10px] opacity-70 italic mt-1">
                  Dort unter "Authorized Domains" auf "Add Domain" klicken.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {firebaseError && firebaseError !== 'unauthorized-domain' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Fehler: {firebaseError}</span>
          </div>
        )}

        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 mb-4"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{uploadSuccess}</span>
          </motion.div>
        )}

        {/* 3 Highlights of live sync */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Echtzeit (WebSockets)</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Trägt ein Familienmitglied eine erledigte Aufgabe ein, aktualisiert sich der Punktestand auf allen anderen Bildschirmen blitzschnell.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Smartphone className="w-4 h-4 text-[var(--m3-primary)]" />
              <span>Plattform-übergreifend</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Funktioniert gleichzeitig auf iPhones, Android-Smartphones, Tablets, Mac und Windows im Browser oder als installierte PWA.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Offline-First</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Punkte eintragen funktioniert auch ohne Empfang im Waschkeller. Die App synchronisiert alles nach, sobald wieder WLAN da ist.
            </p>
          </div>
        </div>
      </div>

      {/* GEMEINSAMER HAUSHALT: JEDER GOOGLE ACCOUNT IST IM GLEICHEN HAUSHALT */}
      {firebaseUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
                Gemeinsamer Haushalt (Alle Google-Konten)
              </h2>
              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                Egal mit welchem Google-Account man sich anmeldet: Immer im selben Haushalt.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
                <strong>Automatischer Haushalts-Verbund:</strong> Alle Familienmitglieder, die sich mit ihrem Google-Konto anmelden, sind sofort und ohne manuelle Einladungscodes im selben gemeinsamen Haushalt (<code>main_household</code>) verbunden.
              </div>
            </div>

            {/* Add Email Form for reference */}
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] uppercase font-black text-[var(--m3-on-surface-variant)] tracking-wider px-1">
                Familien-Kontakte / Notizbuch (Optional)
              </h3>
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--m3-outline)]" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="E-Mail eines Familienmitglieds..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-bold rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newEmail.trim() || !newEmail.includes('@')}
                  className="m3-btn-filled px-5 py-2.5 text-xs font-black disabled:opacity-40 disabled:grayscale whitespace-nowrap"
                >
                  <UserPlus2 className="w-4 h-4 mr-2" />
                  Hinzufügen
                </button>
              </form>

              {/* Email List */}
              <div className="space-y-2">
                {/* Active user */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--m3-on-surface)]">
                        {firebaseUser.email}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Aktuell angemeldet</span>
                    </div>
                  </div>
                </div>

                {/* Additional stored emails */}
                {data.settings.allowed_emails && data.settings.allowed_emails.filter(e => e !== firebaseUser.email).length > 0 ? (
                  data.settings.allowed_emails.filter(e => e !== firebaseUser.email).map((email) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={email}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--m3-surface-container-high)] flex items-center justify-center border border-[var(--m3-outline-variant)]">
                          <Mail className="w-4 h-4 text-[var(--m3-on-surface-variant)]" />
                        </div>
                        <span className="text-xs font-bold text-[var(--m3-on-surface)]">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                        title="Entfernen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. MANUELLER WORKAROUND: JSON EXPORT/IMPORT */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Manueller Datentransfer (Workaround)
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Wenn die Cloud-Synchronisation nicht funktioniert, kannst du deine Daten hier manuell sichern oder übertragen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-500" />
                Daten exportieren
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1">
                Lade alle Aufgaben, Mitglieder und Logs als Datei herunter.
              </p>
            </div>
            <button
              onClick={() => {
                const json = exportDataJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `haushalt_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="m3-btn-tonal py-2 text-xs font-black w-full"
            >
              Backup herunterladen
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                <FileUp className="w-4 h-4 text-amber-500" />
                Daten importieren
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1">
                Wähle eine Backup-Datei aus, um Daten in diesen Browser zu laden.
              </p>
            </div>
            <label className="m3-btn-tonal py-2 text-xs font-black w-full text-center cursor-pointer">
              Datei auswählen
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    const content = re.target?.result as string;
                    if (importDataJSON(content)) {
                      setJsonSuccess('Daten erfolgreich importiert! Die App wird neu geladen...');
                      setJsonError(null);
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      setJsonError('Fehler beim Importieren. Ungültige Datei.');
                      setJsonSuccess(null);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>

        {(jsonError || jsonSuccess) && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
            jsonError ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
          }`}>
            {jsonError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{jsonError || jsonSuccess}</span>
          </div>
        )}
      </div>

      {/* 3. TRANSPARENTE KOSTENERKLÄRUNG (SPARK-PLAN) */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Kostet die Live-Synchronisation Geld?
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Die vollständige, ehrliche Antwort: <strong>Nein, für normale Familienhaushalte ist es 100% kostenlos!</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-[var(--m3-on-surface)]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Firebase Spark-Tarif (Kostenloses Kontingent jeden Tag)</span>
            </div>
            <p className="leading-relaxed text-[11px] text-[var(--m3-on-surface-variant)]">
              Google Firebase stellt im Standard-Tarif ("Spark Plan") jedem Projekt großzügige, täglich erneuernde Freikontingente zur Verfügung:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">50.000 Lesevorgänge</strong>
                <span className="text-[var(--m3-outline)] font-bold">pro Tag kostenlos</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">20.000 Schreibvorgänge</strong>
                <span className="text-[var(--m3-outline)] font-bold">pro Tag kostenlos</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">1 GB Cloud-Speicher</strong>
                <span className="text-[var(--m3-outline)] font-bold">dauerhaft kostenlos</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <h3 className="font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[var(--m3-primary)]" />
              Wieviel verbraucht ein typischer 4- bis 6-Personen-Haushalt?
            </h3>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Wenn jedes Familienmitglied jeden Tag 5 Aufgaben erledigt und 10-mal die App öffnet, erzeugt das ca. <strong>80 bis 250 Operationen pro Tag</strong>.
              Das entspricht <strong>weniger als 0,5%</strong> der kostenlosen Grenze. Selbst wenn ihr 10 Jahre lang jeden Tag Aufgaben protokolliert, bleibt ihr im kostenlosen Rahmen und zahlt <strong>0,00 €</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SCHRITT-FÜR-SCHRITT ANLEITUNG: FAMILIE VERBINDEN */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <h2 className="text-lg font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[var(--m3-primary)]" />
          So richtest du die Synchronisation für deine Familie ein
        </h2>
        <p className="text-xs text-[var(--m3-on-surface-variant)] mb-5">
          In 3 einfachen Schritten synchron auf allen Smartphones und Computern:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Admin meldet sich an & sichert die Basisdaten
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px]">
                Klicke oben auf "Mit Google anmelden". Nach erfolgreichem Login klickst du einmal auf "In Cloud pushen", damit alle bisherigen Aufgaben, Mitglieder und Ziele in deiner Firestore-Datenbank gespeichert sind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs flex-1">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Link an die Familienmitglieder senden
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px] mb-2.5">
                Teile den Link dieser App per WhatsApp, iMessage, Signal oder E-Mail mit deinen Mitbewohnern oder deiner Familie.
              </p>
              <button
                type="button"
                onClick={handleCopyAppUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] text-xs font-black transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link kopiert!' : 'App-Link kopieren'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Auf dem Smartphone öffnen & Profil wählen
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px]">
                Öffnen deine Familienmitglieder den Link auf ihrem Handy, wählen sie einfach ihr Profil aus. Auf iOS tippt man auf "Teilen &gt; Zum Home-Bildschirm", auf Android auf "App installieren". Schon läuft die Haushalts-App wie eine native App!
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
