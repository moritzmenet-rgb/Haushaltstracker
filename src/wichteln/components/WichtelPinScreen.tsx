import React, { useCallback, useEffect, useState } from 'react';
import { Delete } from 'lucide-react';
import { WICHTEL_PIN_LENGTH } from '../types';

interface Props {
  mode: 'create' | 'enter';
  name: string;
  onSubmit: (pin: string) => Promise<void>;
}

/**
 * 6-digit Wichtel-PIN. On the phone via the number pad, on the computer also
 * with the keyboard. In "create" mode the PIN is typed twice.
 */
export const WichtelPinScreen: React.FC<Props> = ({ mode, name, onSubmit }) => {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirming = mode === 'create' && firstPin !== null;

  const submit = useCallback(
    async (value: string) => {
      if (mode === 'create' && firstPin === null) {
        setFirstPin(value);
        setPin('');
        setError(null);
        return;
      }
      if (mode === 'create' && firstPin !== value) {
        setFirstPin(null);
        setPin('');
        setError('Die beiden PINs sind nicht gleich. Leg sie nochmal neu fest.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await onSubmit(value);
      } catch (err) {
        setError((err as Error).message);
        setPin('');
        if (mode === 'create') setFirstPin(null);
      } finally {
        setBusy(false);
      }
    },
    [mode, firstPin, onSubmit],
  );

  const press = useCallback(
    (digit: string) => {
      if (busy) return;
      setError(null);
      setPin((prev) => (prev.length >= WICHTEL_PIN_LENGTH ? prev : prev + digit));
    },
    [busy],
  );

  // Submit once all digits are in (short pause so the last dot is visible)
  useEffect(() => {
    if (pin.length !== WICHTEL_PIN_LENGTH || busy) return;
    const t = setTimeout(() => submit(pin), 120);
    return () => clearTimeout(t);
  }, [pin, busy, submit]);

  const back = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, back]);

  const title =
    mode === 'enter'
      ? 'Deine Wichtel-PIN'
      : confirming
        ? 'PIN nochmal eingeben'
        : 'Leg deine Wichtel-PIN fest';

  const text =
    mode === 'enter'
      ? `Hallo ${name}. Gib deine 6-stellige Wichtel-PIN ein.`
      : confirming
        ? 'Zur Sicherheit noch einmal dieselben 6 Ziffern.'
        : 'Mit dieser PIN siehst nur du deine Wichtel-Sachen. Wähle 6 Ziffern und merk sie dir gut.';

  return (
    <div className="w-pin-box">
      <h2 className="w-h2">{title}</h2>
      <p className="w-muted">{text}</p>

      <div className="w-pin-dots" aria-label={`${pin.length} von ${WICHTEL_PIN_LENGTH} Ziffern`}>
        {Array.from({ length: WICHTEL_PIN_LENGTH }, (_, i) => (
          <span key={i} className={`w-pin-dot ${i < pin.length ? 'is-filled' : ''}`} />
        ))}
      </div>
      <div style={{ minHeight: 40 }} role="alert">
        {error && <p className="w-error">{error}</p>}
        {busy && <p className="w-muted">Einen Moment …</p>}
      </div>

      <div className="w-pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="w-pin-key" onClick={() => press(d)} disabled={busy}>
            {d}
          </button>
        ))}
        <span />
        <button type="button" className="w-pin-key" onClick={() => press('0')} disabled={busy}>
          0
        </button>
        <button type="button" className="w-pin-key is-plain" onClick={back} aria-label="Letzte Ziffer löschen" disabled={busy}>
          <Delete className="w-5 h-5 mx-auto" />
        </button>
      </div>

      {mode === 'enter' && (
        <p className="w-muted" style={{ marginTop: 24 }}>
          PIN vergessen? Moritz kann sie zurücksetzen. Deine Wünsche bleiben erhalten.
        </p>
      )}
    </div>
  );
};
