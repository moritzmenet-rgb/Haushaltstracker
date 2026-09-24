import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Löschen',
  cancelLabel = 'Abbrechen',
  isDanger = true,
  isDestructive = false,
  onConfirm,
  onCancel,
  onClose
}) => {
  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const danger = isDanger || isDestructive;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md m3-dialog overflow-hidden p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-xs ${
              danger 
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                : 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]'
            }`}>
              {danger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-black text-[var(--m3-on-surface)] leading-tight mb-1">
                {title}
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--m3-outline-variant)]/60">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
            >
              {cancelLabel}
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-black text-white shadow-xs transition ${
                danger
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-[var(--m3-primary)] hover:bg-[var(--m3-primary-hover)]'
              }`}
            >
              {confirmLabel}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
