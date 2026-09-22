import React from 'react';
import { motion } from 'motion/react';
import { Cloud, ArrowRight, ShieldCheck, Sparkles, LogIn, HardDrive, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CloudOnboardingProps {
  onLocalSetup: () => void;
}

export const CloudOnboarding: React.FC<CloudOnboardingProps> = ({ onLocalSetup }) => {
  const { loginWithGoogle, firebaseError, syncStatus } = useApp();
  const isConnecting = syncStatus === 'connecting';

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
          {isConnecting ? 'Verbindung wird hergestellt...' : 'Willkommen zurück!'}
        </h1>
        
        <p className="text-[var(--m3-on-surface-variant)] font-bold text-sm leading-relaxed mb-10 px-4">
          {isConnecting 
            ? 'Deine Familiendaten werden aus der Cloud geladen. Einen Moment bitte...'
            : 'Bist du bereits Teil einer Familie? Melde dich an, um eure gemeinsamen Aufgaben und Punkte zu synchronisieren.'}
        </p>

        <div className="space-y-4">
          <button
            onClick={loginWithGoogle}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--m3-primary)] text-white rounded-3xl font-black text-sm hover:opacity-90 transition-all shadow-md group disabled:opacity-70"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isConnecting ? 'Anmelden...' : 'Mit Google anmelden'}
            {!isConnecting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>

          {!isConnecting && (
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

        {firebaseError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] font-bold"
          >
            {firebaseError === 'unauthorized-domain' 
              ? 'Domain nicht autorisiert. Bitte Einstellungen prüfen.' 
              : `Fehler: ${firebaseError}`}
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
