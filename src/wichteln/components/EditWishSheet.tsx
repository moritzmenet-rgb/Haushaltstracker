import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { NewWishInput, Wish } from '../types';
import { PrioStars } from './WishCard';

interface Props {
  /** the wish being edited; null = closed */
  wish: Wish | null;
  onClose: () => void;
  onSave: (wish: Wish, input: NewWishInput) => Promise<void>;
}

const toInput = (w: Wish): NewWishInput => ({
  title: w.title,
  price: w.price ?? '',
  where: w.where ?? '',
  hint: w.hint ?? '',
  prio: w.prio ?? null,
});

/** Owner changes a wish later: everything except deleting it. */
export const EditWishSheet: React.FC<Props> = ({ wish, onClose, onSave }) => {
  const [input, setInput] = useState<NewWishInput>({ title: '', price: '', where: '', hint: '', prio: null });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const open = !!wish;

  useEffect(() => {
    if (!wish) return;
    setInput(toInput(wish));
    setTitleError(null);
    setError(null);
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

  const set = (key: keyof NewWishInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput((prev) => ({ ...prev, [key]: e.target.value }));
    if (key === 'title') setTitleError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish) return;
    if (!input.title.trim()) {
      setTitleError('Der Wunsch braucht einen Namen.');
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(wish, input);
      onClose();
    } catch {
      setError('Die Änderung konnte nicht gespeichert werden. Versuch es nochmal.');
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
            aria-label="Wunsch bearbeiten"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          >
            <div className="w-sheet-grip" />
            <form onSubmit={save} noValidate>
              <h2 className="w-sheet-title">Wunsch bearbeiten</h2>
              <p className="w-muted" style={{ marginBottom: 24 }}>
                Danach steht «(bearbeitet)» dabei, auch bei deinen Wichteln. Löschen geht nicht.
              </p>

              <div className="w-field">
                <label className="w-label" htmlFor="w-edit-title">Was wünschst du dir?</label>
                <input
                  id="w-edit-title"
                  ref={titleRef}
                  className={`w-input ${titleError ? 'is-error' : ''}`}
                  value={input.title}
                  onChange={set('title')}
                  maxLength={120}
                  aria-invalid={!!titleError}
                />
                {titleError && <span className="w-error">{titleError}</span>}
              </div>
              <div className="w-field">
                <span className="w-label">Wie wichtig ist dir das?</span>
                <PrioStars value={input.prio} onChange={(p) => setInput((prev) => ({ ...prev, prio: prev.prio === p ? null : p }))} showLabel />
              </div>
              <div className="w-field">
                <label className="w-label" htmlFor="w-edit-price">Preis (ungefähr)</label>
                <input id="w-edit-price" className="w-input" value={input.price} onChange={set('price')} maxLength={40} placeholder="z. B. 50 CHF" />
              </div>
              <div className="w-field">
                <label className="w-label" htmlFor="w-edit-where">Wo gesehen (Laden oder Link)</label>
                <input id="w-edit-where" className="w-input" value={input.where} onChange={set('where')} maxLength={300} placeholder="z. B. Manor oder https://…" />
              </div>
              <div className="w-field">
                <label className="w-label" htmlFor="w-edit-hint">Beschreibung</label>
                <textarea
                  id="w-edit-hint"
                  className="w-input w-textarea"
                  value={input.hint}
                  onChange={set('hint')}
                  maxLength={300}
                  rows={3}
                  placeholder="z. B. Grösse M, am liebsten in Blau"
                />
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
