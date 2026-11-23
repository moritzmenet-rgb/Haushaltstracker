import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Wish } from '../types';

interface Props {
  /** the wish being edited; null = closed */
  wish: Wish | null;
  onClose: () => void;
  onSave: (wish: Wish, hint: string) => Promise<void>;
}

export const HINT_MAX = 300;

/** Owner changes the description of a wish later. Title, price and place stay fixed. */
export const EditHintSheet: React.FC<Props> = ({ wish, onClose, onSave }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const open = !!wish;

  useEffect(() => {
    if (!wish) return;
    setText(wish.hint ?? '');
    setError(null);
    const t = setTimeout(() => {
      const el = fieldRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 80);
    return () => clearTimeout(t);
    // only when a different wish is opened, not on live updates of the same one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wish?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish) return;
    // unchanged: no write, so the Wichtel don't see "geändert" for nothing
    if (text.trim() === (wish.hint ?? '').trim()) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(wish, text);
      onClose();
    } catch {
      setError('Die Beschreibung konnte nicht gespeichert werden. Versuch es nochmal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {wish && (
        <>
          <motion.div
            className="w-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22 } }}
            onClick={busy ? undefined : onClose}
          />
          <motion.div
            className="w-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Beschreibung ändern"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          >
            <div className="w-sheet-grip" />
            <form onSubmit={save} noValidate>
              <h2 className="w-sheet-title">Beschreibung ändern</h2>
              <p className="w-muted" style={{ marginBottom: 24 }}>
                Zu «{wish.title}». Danach steht «(bearbeitet)» dabei, auch bei deinen Wichteln.
              </p>
              <div className="w-field">
                <label className="w-label" htmlFor="w-edit-hint">Beschreibung</label>
                <textarea
                  id="w-edit-hint"
                  ref={fieldRef}
                  className="w-input w-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={HINT_MAX}
                  rows={3}
                  placeholder="z. B. Grösse M, am liebsten in Blau"
                />
                <span className="w-hint-count" aria-live="polite">
                  {text.length > HINT_MAX - 40 ? `Noch ${HINT_MAX - text.length} Zeichen` : ''}
                </span>
              </div>
              {error && <p className="w-error" style={{ marginTop: 4 }}>{error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24 }}>
                <button type="submit" className="w-btn w-btn-primary w-btn-block" disabled={busy}>
                  {busy ? 'Einen Moment …' : 'Speichern'}
                </button>
                <button type="button" className="w-btn w-btn-ghost w-btn-block" onClick={onClose} disabled={busy}>
                  Abbrechen
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
