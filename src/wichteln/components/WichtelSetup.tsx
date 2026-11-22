import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { getInitials } from '../../utils';
import { haptic } from '../../utils/haptics';
import { RECEIVERS_PER_PERSON } from '../types';
import { WichtelConfirm } from './WichtelConfirm';

interface Props {
  me: FamilyMember;
  members: FamilyMember[];
  onSave: (receivers: [string, string]) => Promise<void>;
}

/** First open: "Wen beschenkst du dieses Jahr?" – exactly two people, then fixed. */
export const WichtelSetup: React.FC<Props> = ({ me, members, onSave }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const others = members.filter((m) => m.id !== me.id);

  const toggle = (id: string) => {
    haptic.selection();
    setError(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= RECEIVERS_PER_PERSON) return [prev[1], id];
      return [...prev, id];
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave([selected[0], selected[1]]);
    } catch {
      setError('Das Speichern hat nicht geklappt. Versuch es nochmal.');
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const names = selected.map((id) => others.find((m) => m.id === id)?.name ?? '').join(' und ');

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="w-h2" style={{ fontSize: 28 }}>Wen beschenkst du dieses Jahr?</h2>
      <p className="w-muted">
        Ihr habt eure Wichtel schon ausgelost. Tipp die zwei Personen an, die du beschenkst.
      </p>

      <div className="w-people" role="group" aria-label="Familienmitglieder">
        {others.map((m) => {
          const isSel = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`w-person ${isSel ? 'is-selected' : ''}`}
              aria-pressed={isSel}
              onClick={() => toggle(m.id)}
            >
              {isSel && (
                <span className="w-person-check">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
              <span className="w-avatar" style={{ backgroundColor: m.avatar_color }}>
                {getInitials(m.name)}
              </span>
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="w-btn w-btn-primary"
          disabled={selected.length !== RECEIVERS_PER_PERSON}
          onClick={() => setConfirmOpen(true)}
        >
          Speichern
        </button>
        <span className="w-counter">
          {selected.length} von {RECEIVERS_PER_PERSON}
        </span>
      </div>
      {error && <p className="w-error" style={{ marginTop: 8 }}>{error}</p>}

      <WichtelConfirm
        open={confirmOpen}
        title={`Du beschenkst ${names}?`}
        text="Das ist danach fix. Ändern kann es nur noch Moritz."
        confirmLabel="Speichern"
        cancelLabel="Nochmal ansehen"
        busy={busy}
        onConfirm={save}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
