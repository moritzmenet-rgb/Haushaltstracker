import React from 'react';
import { motion } from 'motion/react';
import { Cloud, ArrowRight, ShieldCheck, Sparkles, LogIn, HardDrive, Loader2, LogOut, RefreshCcw, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CloudOnboardingProps {
  onLocalSetup: () => void;
}

export const CloudOnboarding: React.FC<CloudOnboardingProps> = ({ onLocalSetup }) => {
  const { loginWithGoogle, logoutFirebase, firebaseError, syncStatus, firebaseUser } = useApp();
  const isConnecting = syncStatus === 'connecting';
  const hasError = syncStatus === 'error' || !!firebaseError;

  const handleReset = () => {
    if (window.confirm('App wirklich zurücksetzen? Lokale Daten werden gelöscht und neu aus der Cloud geladen.')) {
      localStorage.removeItem('household_chore_tracker_data_v3');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--m3-surface)] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-[40px] p-8 shadow-2xl text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-[var(--m3-primary)] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg relative"
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

        <h1 className="text-3xl font-black text-[var(--m3-on-surface)] mb-4 tracking-tight">
          {isConnecting ? 'Daten werden geladen...' : hasError ? 'Startproblem' : 'Willkommen zurück!'}
        </h1>
        
        <p className="text-[var(--m3-on-surface-variant)] font-bold text-sm leading-relaxed mb-10 px-4">
          {isConnecting 
            ? 'Deine Familiendaten werden aus der Cloud geladen. Einen Moment bitte...'
            : hasError
            ? 'Wir konnten die Verbindung zur Cloud nicht stabil herstellen. Das kann an fehlenden Berechtigungen oder einer schlechten Verbindung liegen.'
            : 'Bist du bereits Teil einer Familie? Melde dich an, um eure gemeinsamen Aufgaben und Punkte zu synchronisieren.'}
        </p>

        <div className="space-y-4">
          {!firebaseUser ? (
            <div className="space-y-4">
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-primary)] text-white rounded-3xl font-black text-sm hover:opacity-90 transition-all shadow-md group"
              >
                <LogIn className="w-5 h-5" />
                Mit Google anmelden
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="pt-4 border-t border-[var(--m3-outline-variant)]">
                <button
                  onClick={onLocalSetup}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] rounded-3xl font-black text-sm border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)] transition-all"
                >
                  <HardDrive className="w-5 h-5 opacity-60" />
                  Ohne Login starten (Lokal)
                </button>
                <p className="mt-2 text-[10px] text-[var(--m3-on-surface-variant)] opacity-60 px-4">
                  Hinweis: Ohne Google-Login werden keine Daten zwischen Geräten synchronisiert.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isConnecting && (
                <div className="flex items-center justify-center gap-3 py-4 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface-variant)] rounded-3xl font-black text-sm border border-[var(--m3-outline-variant)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synchronisiere...
                </div>
              )}
              
              {hasError && (
                <>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-primary)] text-white rounded-3xl font-black text-sm hover:opacity-90 transition-all shadow-md"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Erneut versuchen
                  </button>
                  <button
                    onClick={logoutFirebase}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] rounded-3xl font-black text-sm border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)] transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Abmelden / Konto wechseln
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 text-rose-600 rounded-3xl font-black text-sm border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    App-Cache löschen & Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {(firebaseError || (hasError && firebaseUser)) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] font-bold text-left"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-wider text-[9px]">System-Meldung:</p>
                <p className="leading-tight">
                  {firebaseError === 'unauthorized-domain' 
                    ? 'Diese Domain ist in Firebase nicht autorisiert. Bitte den Admin kontaktieren.' 
                    : firebaseError || 'Datenzugriff eingeschränkt. Bitte prüfe dein Konto oder versuche den Reset-Button.'}
                </p>
                {firebaseUser && (
                  <p className="mt-2 pt-2 border-t border-rose-500/10 opacity-70">
                    Eingeloggt als: {firebaseUser.email}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale pointer-events-none">
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
