import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SyncFeedbackBanner: React.FC = () => {
  const { syncFeedback } = useApp();

  return (
    <AnimatePresence>
      {syncFeedback && syncFeedback.status !== 'idle' && (
        <motion.div
          key={syncFeedback.status + (syncFeedback.timestamp || '')}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[90vw] sm:max-w-md"
        >
          <div
            className={`px-4 py-2.5 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-black tracking-wide border transition-all ${
              syncFeedback.status === 'uploading'
                ? 'bg-[var(--m3-surface-container-highest)]/95 border-[var(--m3-primary)] text-[var(--m3-on-surface)] shadow-indigo-500/20'
                : syncFeedback.status === 'saved'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/30'
                : 'bg-rose-600 text-white border-rose-400 shadow-rose-600/30'
            }`}
          >
            {syncFeedback.status === 'uploading' && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--m3-primary)]" />
                <Cloud className="w-3.5 h-3.5 text-[var(--m3-primary)] animate-pulse" />
              </div>
            )}
            {syncFeedback.status === 'saved' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 stroke-[2.5]" />
            )}
            {syncFeedback.status === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            )}

            <span className="truncate">{syncFeedback.text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
