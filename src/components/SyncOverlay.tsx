import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Cloud, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SyncOverlay: React.FC = () => {
  const { syncFeedback } = useApp();
  const isUploading = syncFeedback.status === 'uploading';

  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] rounded-[32px] p-8 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[var(--m3-primary)]/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-[var(--m3-primary)] border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-[var(--m3-primary)] animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-[var(--m3-on-surface)] leading-tight">
                Wird gespeichert...
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] font-bold mt-1.5 px-2">
                Deine Änderungen werden sicher in der Cloud synchronisiert.
              </p>
            </div>

            <div className="flex items-center gap-1.5 opacity-50 mt-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Sync</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
