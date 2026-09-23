import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Cloud, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SyncOverlay: React.FC = () => {
  const { syncFeedback } = useApp();
  const isUploading = syncFeedback.status === 'uploading';
  const isError = syncFeedback.status === 'error';

  return (
    <AnimatePresence>
      {(isUploading || isError) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl flex flex-col items-center gap-5 text-center border ${
              isError 
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/30' 
                : 'bg-[var(--m3-surface-container-high)] border-[var(--m3-outline-variant)]'
            }`}
          >
            {isUploading ? (
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[var(--m3-primary)]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[var(--m3-primary)] border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-[var(--m3-primary)] animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Cloud className="w-8 h-8 text-white" />
              </div>
            )}
            
            <div>
              <h3 className={`text-xl font-black leading-tight ${isError ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--m3-on-surface)]'}`}>
                {isError ? 'Fehler aufgetreten' : 'Wird gespeichert...'}
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] font-bold mt-2 px-2 leading-relaxed">
                {isError 
                  ? syncFeedback.text 
                  : 'Deine Änderungen werden sicher in der Cloud synchronisiert.'}
              </p>
            </div>

            {isError && (
              <p className="text-[10px] text-[var(--m3-outline)] font-bold bg-rose-500/5 px-3 py-2 rounded-xl">
                Tipp: Prüfe deine Internetverbindung oder versuche es erneut.
              </p>
            )}

            {!isError && (
              <div className="flex items-center gap-1.5 opacity-40 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Cloud Sync</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
