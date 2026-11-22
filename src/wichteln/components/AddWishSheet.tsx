import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { NewWishInput, Wish } from '../types';
import { WishCard } from './WishCard';

interface Props {
  open: boolean;
  nextPosition: number;
  onClose: () => void;
  onSave: (input: NewWishInput) => Promise<void>;
}

const EMPTY: NewWishInput = { title: '', price: '', where: '', hint: '' };

/** Note-book sheet: fill in the wish, then confirm "Achtung, der Wunsch ist danach fix." */
export const AddWishSheet: React.FC<Props> = ({ open, nextPosition, onClose, onSave }) => {
  const [input, setInput] = useState<NewWishInput>(EMPTY);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInput(EMPTY);
      setStep('form');
      setTitleError(null);
      setSaveError(null);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const set = (key: keyof NewWishInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prev) => ({ ...prev, [key]: e.target.value }));
    if (key === 'title') setTitleError(null);
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.title.trim()) {
      setTitleError('Schreib kurz, was du dir wünschst.');
      titleRef.current?.focus();
      return;
    }
    setStep('confirm');
  };

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      await onSave(input);
      onClose();
    } catch {
      setSaveError('Das Speichern hat nicht geklappt. Versuch es nochmal.');
    } finally {
      setBusy(false);
    }
  };

  const preview: Wish = {
    id: 'preview',
    owner_id: '',
    title: input.title.trim(),
    price: input.price.trim() || null,
    where: input.where.trim() || null,
    hint: input.hint.trim() || null,
    rank: 0,
    created_at: '',
  };

  return (
    <AnimatePresence>
      {open && (
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
            aria-label="Neuer Wunsch"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          >
            <div className="w-sheet-grip" />
            {step === 'form' ? (
              <form onSubmit={next} noValidate>
                <h2 className="w-sheet-title">Neuer Wunsch</h2>
                <p className="w-muted" style={{ marginBottom: 24 }}>
                  Nur deine zwei Wichtel sehen ihn.
                </p>

                <div className="w-field">
                  <label className="w-label" htmlFor="w-title">Was wünschst du dir?</label>
                  <input
                    id="w-title"
                    ref={titleRef}
                    className={`w-input ${titleError ? 'is-error' : ''}`}
                    value={input.title}
                    onChange={set('title')}
                    maxLength={120}
                    placeholder="z. B. PS5"
                    aria-invalid={!!titleError}
                  />
                  {titleError && <span className="w-error">{titleError}</span>}
                </div>
                <div className="w-field">
                  <label className="w-label" htmlFor="w-price">Preis (ungefähr)</label>
                  <input id="w-price" className="w-input" value={input.price} onChange={set('price')} maxLength={40} placeholder="z. B. 50 CHF" />
                </div>
                <div className="w-field">
                  <label className="w-label" htmlFor="w-where">Wo gesehen (Laden oder Link)</label>
                  <input id="w-where" className="w-input" value={input.where} onChange={set('where')} maxLength={300} placeholder="z. B. Manor oder https://…" />
                </div>
                <div className="w-field">
                  <label className="w-label" htmlFor="w-hint">Hinweis (optional)</label>
                  <input id="w-hint" className="w-input" value={input.hint} onChange={set('hint')} maxLength={300} placeholder="z. B. Gibt es nur in Wädenswil im Laden XY" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24 }}>
                  <button type="submit" className="w-btn w-btn-primary w-btn-block">Weiter</button>
                  <button type="button" className="w-btn w-btn-ghost w-btn-block" onClick={onClose}>Abbrechen</button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="w-sheet-title">Achtung, der Wunsch ist danach fix.</h2>
                <p className="w-muted" style={{ marginBottom: 24 }}>
                  Du kannst ihn nicht mehr ändern oder löschen, nur im Ranking verschieben.
                </p>
                <WishCard wish={preview} position={nextPosition} />
                {saveError && <p className="w-error" style={{ marginTop: 12 }}>{saveError}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24 }}>
                  <button type="button" className="w-btn w-btn-primary w-btn-block" onClick={save} disabled={busy}>
                    {busy ? 'Einen Moment …' : 'Speichern'}
                  </button>
                  <button type="button" className="w-btn w-btn-ghost w-btn-block" onClick={() => setStep('form')} disabled={busy}>
                    Nochmal ansehen
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
