import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small confirmation sheet (bottom on the phone, centred on the computer). */
export const WichtelConfirm: React.FC<Props> = ({
  open, title, text, confirmLabel, cancelLabel, busy, danger, children, onConfirm, onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          className="w-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22 } }}
          onClick={busy ? undefined : onCancel}
        />
        <motion.div
          className="w-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          style={{ backgroundImage: 'none' }}
        >
          <div className="w-sheet-grip" />
          <h2 className="w-h2">{title}</h2>
          <p className="w-muted" style={{ marginBottom: 16 }}>{text}</p>
          {children}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24 }}>
            <button
              type="button"
              className={`w-btn w-btn-block ${danger ? 'w-btn-danger' : 'w-btn-primary'}`}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Einen Moment …' : confirmLabel}
            </button>
            <button type="button" className="w-btn w-btn-ghost w-btn-block" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
