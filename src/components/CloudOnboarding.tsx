import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, ArrowRight, ShieldCheck, Sparkles, HardDrive, Loader2, LogOut, RefreshCcw, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearAllLocalPersistence } from '../firebase';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 170 170">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.65-7.85-11.87-14.34-6.3-9.69-11.05-20.91-14.25-33.67-3.2-12.76-4.8-24.89-4.8-36.38 0-14.61 3.59-26.69 10.77-36.23 7.18-9.55 16.27-14.43 27.27-14.65 4.89 0 10.37 1.25 16.44 3.75 6.07 2.5 10.15 3.8 12.24 3.91 1.74-.11 6.04-1.46 12.91-4.04 6.87-2.58 12.44-3.72 16.71-3.41 12.82.88 23.01 5.92 30.58 15.13-11.09 6.74-16.53 15.98-16.32 27.72.22 9.24 3.7 17.06 10.45 23.48 6.74 6.41 14.88 10.11 24.43 11.09-2.17 6.74-4.89 13.91-8.15 21.52zM119.22 31.84c0-7.39 2.66-14.45 7.99-21.19 5.33-6.74 11.96-10.65 19.89-11.74.22 1.09.33 2.17.33 3.26 0 7.28-2.77 14.34-8.32 21.19-5.54 6.85-12.17 10.65-19.89 11.41z" />
  </svg>
);

interface CloudOnboardingProps {
  onLocalSetup: () => void;
}

export const CloudOnboarding: React.FC<CloudOnboardingProps> = ({ onLocalSetup }) => {
  const { loginWithGoogle, loginWithApple, logoutFirebase, firebaseError, syncStatus, firebaseUser, retrySync } = useApp();
  const [isResetting, setIsResetting] = useState(false);
  const isConnecting = syncStatus === 'connecting';
  const hasError = syncStatus === 'error' || !!firebaseError;

  const handleReset = async () => {
    if (window.confirm('App wirklich zurücksetzen? Lokale Daten & temporärer Cache werden vollständig geleert und neu aus der Cloud geladen.')) {
      setIsResetting(true);
      await clearAllLocalPersistence();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--m3-surface)] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-[40px] p-8 shadow-2xl text-center my-auto"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-[var(--m3-primary)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg relative"
        >
          {hasError ? (
            <RefreshCcw className="w-10 h-10 text-white" />
          ) : (
            <Cloud className="w-10 h-10 text-white" />
          )}
          {isConnecting && (
            <div className="absolute -inset-2">
              <div className="w-full h-full border-4 border-[var(--m3-primary)] border-t-transparent rounded-[32px] animate-spin" />
            </div>
          )}
        </motion.div>

        <h1 className="text-3xl font-black text-[var(--m3-on-surface)] mb-3 tracking-tight">
          {isConnecting ? 'Daten werden synchronisiert...' : hasError ? 'Synchronisations-Hinweis' : 'Willkommen!'}
        </h1>
        
        <p className="text-[var(--m3-on-surface-variant)] font-bold text-sm leading-relaxed mb-6 px-2">
          {isConnecting 
            ? 'Deine Familiendaten werden aus der Cloud synchronisiert. Einen kleinen Moment bitte...'
            : hasError
            ? 'Die Verbindung zur Cloud wird im Hintergrund aktualisiert. Du kannst direkt lokal weitermachen oder die Verbindung neu laden.'
            : 'Bist du bereits Teil einer Familie? Melde dich mit Google oder Apple an, um eure gemeinsamen Aufgaben und Punkte zu synchronisieren.'}
        </p>

        <div className="space-y-3">
          {!firebaseUser ? (
            <div className="space-y-3">
              {/* Google Login */}
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[var(--m3-surface-container-highest)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] rounded-2xl font-black text-sm border border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition-all shadow-xs group cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Mit Google anmelden</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Apple Login */}
              <button
                type="button"
                onClick={loginWithApple}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-2xl font-black text-sm transition-all shadow-md group cursor-pointer disabled:opacity-50"
              >
                <AppleIcon />
                <span>Mit Apple anmelden</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Family Link hint */}
              <div className="p-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-left flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-[var(--m3-primary)] mt-0.5" />
                <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-snug font-medium">
                  <strong>Familien-Tipp:</strong> Bei Kinderkonten (Google Family Link) nach der Eltern-Bestätigung einfach kurz warten – du wirst direkt in den Haushalt eingeloggt.
                </p>
              </div>
              
              <div className="pt-3 border-t border-[var(--m3-outline-variant)]">
                <button
                  type="button"
                  onClick={onLocalSetup}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] rounded-2xl font-bold text-xs hover:bg-[var(--m3-surface-container-high)] transition-all cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 opacity-60" />
                  <span>Ohne Login starten (Nur lokal)</span>
                </button>
                <p className="mt-1 text-[10px] text-[var(--m3-on-surface-variant)] opacity-60 px-4">
                  Hinweis: Ohne Cloud-Login werden Aufgaben nicht mit anderen Familienmitgliedern geteilt.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isConnecting && (
                <div className="flex items-center justify-center gap-3 py-4 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface-variant)] rounded-2xl font-black text-sm border border-[var(--m3-outline-variant)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verbinde mit Firestore...</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={retrySync}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[var(--m3-primary)] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <RefreshCcw className="w-5 h-5" />
                <span>Erneut synchronisieren</span>
              </button>

              <button
                type="button"
                onClick={onLocalSetup}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] rounded-2xl font-black text-sm border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)] transition-all cursor-pointer"
              >
                <HardDrive className="w-5 h-5 opacity-60" />
                <span>App jetzt öffnen (Lokal/Offline)</span>
              </button>

              <button
                type="button"
                onClick={logoutFirebase}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] rounded-2xl font-black text-sm border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)] transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Abmelden / Anderes Konto wählen</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="w-full flex items-center justify-center gap-3 py-3 bg-rose-500/10 text-rose-600 rounded-2xl font-bold text-xs border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                <span>App-Cache leeren & Reset</span>
              </button>
            </div>
          )}
        </div>

        {(firebaseError || (hasError && firebaseUser)) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold text-left"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-wider text-[9px]">Status-Info:</p>
                <p className="leading-tight">
                  {firebaseError || 'Cloud-Synchronisation wird initialisiert.'}
                </p>
                {firebaseUser && (
                  <p className="mt-2 pt-2 border-t border-amber-500/10 opacity-80">
                    Eingeloggt als: {firebaseUser.email || firebaseUser.uid}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 flex items-center justify-center gap-6 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase">Sicher</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase">Einfach</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
