import React from 'react';
import { motion } from 'motion/react';
import { Cloud, ArrowRight, ShieldCheck, Sparkles, LogIn, HardDrive, Loader2, LogOut, RefreshCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CloudOnboardingProps {
  onLocalSetup: () => void;
}

export const CloudOnboarding: React.FC<CloudOnboardingProps> = ({ onLocalSetup }) => {
  const { loginWithGoogle, logoutFirebase, firebaseError, syncStatus, firebaseUser } = useApp();
  const isConnecting = syncStatus === 'connecting';
  const hasError = syncStatus === 'error' || firebaseError;

  const handleReset = () => {
    localStorage.removeItem('household_chore_tracker_data_v3');
    window.location.reload();
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
          <Cloud className="w-10 h-10 text-white" />
          {isConnecting && (
            <div className="absolute -inset-2">
              <div className="w-full h-full border-4 border-[var(--m3-primary)] border-t-transparent rounded-[32px] animate-spin" />
            </div>
          )}
        </motion.div>

        <h1 className="text-3xl font-black text-[var(--m3-on-surface)] mb-4 tracking-tight">
          {isConnecting ? 'Daten werden geladen...' : hasError ? 'Problem erkannt' : 'Willkommen zurück!'}
        </h1>
        
        <p className="text-[var(--m3-on-surface-variant)] font-bold text-sm leading-relaxed mb-10 px-4">
          {isConnecting 
            ? 'Deine Familiendaten werden aus der Cloud geladen. Einen Moment bitte...'
            : hasError
            ? 'Wir konnten deinen Haushalt nicht laden. Bist du mit dem richtigen Konto angemeldet?'
            : 'Bist du bereits Teil einer Familie? Melde dich an, um eure gemeinsamen Aufgaben und Punkte zu synchronisieren.'}
        </p>

        <div className="space-y-4">
          {!firebaseUser ? (
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-primary)] text-white rounded-3xl font-black text-sm hover:opacity-90 transition-all shadow-md group"
            >
              <LogIn className="w-5 h-5" />
              Mit Google anmelden
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
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
                    onClick={logoutFirebase}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] rounded-3xl font-black text-sm border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)] transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Anderes Konto wählen
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 text-rose-600 rounded-3xl font-black text-sm border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    App zurücksetzen
                  </button>
                </>
              )}
            </div>
          )}

          {!isConnecting && !firebaseUser && (
            <div className="pt-8 border-t border-[var(--m3-outline-variant)]">
              <p className="text-[10px] uppercase font-black text-[var(--m3-outline)] tracking-widest mb-4">
                Oder ganz neu starten
              </p>
              <button
                onClick={onLocalSetup}
                className="inline-flex items-center gap-2 text-xs font-black text-[var(--m3-primary)] hover:underline opacity-70 hover:opacity-100 transition-all"
              >
                <HardDrive className="w-3.5 h-3.5" />
                App lokal aufsetzen
              </button>
            </div>
          )}
        </div>

        {(firebaseError || (hasError && firebaseUser)) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] font-bold"
          >
            {firebaseError === 'unauthorized-domain' 
              ? 'Domain nicht autorisiert.' 
              : 'Zugriff verweigert. Bitte stelle sicher, dass deine E-Mail in der Familien-Liste steht.'}
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
