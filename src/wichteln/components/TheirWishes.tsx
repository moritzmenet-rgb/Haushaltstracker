import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Gift } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { getInitials } from '../../utils';
import { haptic } from '../../utils/haptics';
import { claimWish, subscribeClaimsFor, subscribeWishesOf, unclaimWish } from '../wichtelService';
import type { Wish, WishClaim } from '../types';
import { WishCard } from './WishCard';

interface ReceiverProps {
  season: string;
  myId: string;
  receiver: FamilyMember;
}

/**
 * One person I gift. Wishes another Wichtel already claimed are left out completely,
 * my own claims stay visible in green with the "Wunsch gemerkt" stamp.
 */
const ReceiverList: React.FC<ReceiverProps> = ({ season, myId, receiver }) => {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [claims, setClaims] = useState<Record<string, WishClaim>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(
    () => subscribeWishesOf(season, receiver.id, setWishes, () => setError(`Die Wünsche von ${receiver.name} konnten nicht geladen werden.`)),
    [season, receiver.id, receiver.name],
  );
  useEffect(
    () => subscribeClaimsFor(season, receiver.id, setClaims, () => setError('Abhakungen konnten nicht geladen werden.')),
    [season, receiver.id],
  );

  const toggle = async (wish: Wish) => {
    if (pending) return;
    const mine = claims[wish.id]?.claimed_by === myId;
    setPending(wish.id);
    setError(null);
    try {
      if (mine) {
        await unclaimWish(season, wish.id);
        haptic.light();
      } else {
        const ok = await claimWish(season, wish, myId);
        if (ok) haptic.success();
        else setError('Da war jemand schneller. Dieser Wunsch ist schon vergeben.');
      }
    } catch {
      setError('Das hat nicht geklappt. Versuch es nochmal.');
    } finally {
      setPending(null);
    }
  };

  if (wishes === null && !error) return <div className="w-spinner" aria-label="Wird geladen" />;

  const all = wishes ?? [];
  const visible = all.filter((w) => !claims[w.id] || claims[w.id].claimed_by === myId);
  const openCount = all.filter((w) => !claims[w.id]).length;
  const myCount = all.filter((w) => claims[w.id]?.claimed_by === myId).length;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="w-avatar w-avatar-sm" style={{ backgroundColor: receiver.avatar_color }}>
          {getInitials(receiver.name)}
        </span>
        <h3 className="w-h3" style={{ margin: 0 }}>{receiver.name}</h3>
        {myCount > 0 && <span className="w-muted">· {myCount} gemerkt</span>}
      </div>
      {error && <p className="w-error" style={{ marginBottom: 12 }}>{error}</p>}

      {all.length === 0 ? (
        <div className="w-empty">
          <p className="w-empty-title">Noch keine Wünsche</p>
          <p className="w-muted">{receiver.name} hat noch nichts eingetragen. Schau später nochmal rein.</p>
        </div>
      ) : (
        <>
          <ol className="w-list">
            <AnimatePresence initial={false}>
              {visible.map((w) => {
                const position = all.indexOf(w) + 1;
                const mine = claims[w.id]?.claimed_by === myId;
                return (
                  <motion.li
                    key={w.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.4, height: 0, marginTop: -12, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }}
                    style={{ transformOrigin: 'top center', listStyle: 'none' }}
                  >
                    <WishCard
                      wish={w}
                      position={position}
                      claimed={mine}
                      tilt={position % 2 ? -0.5 : 0.5}
                      action={
                        <button
                          type="button"
                          className="w-claim"
                          onClick={() => toggle(w)}
                          disabled={pending === w.id}
                          aria-pressed={mine}
                          aria-label={mine ? `${w.title}: Merken rückgängig machen` : `${w.title}: Ich besorge das`}
                        >
                          <span className="w-claim-knob">
                            {mine ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <Gift className="w-5 h-5" />}
                          </span>
                          <span>{mine ? 'Gemerkt' : 'Ich besorge das'}</span>
                        </button>
                      }
                    />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
          {openCount === 0 && (
            <div className="w-empty" style={{ marginTop: visible.length ? 16 : 0 }}>
              {myCount > 0 ? (
                <>
                  <p className="w-empty-title">Alles gemerkt. Gut gemacht.</p>
                  <p className="w-muted">Für {receiver.name} ist kein Wunsch mehr offen.</p>
                </>
              ) : (
                <>
                  <p className="w-empty-title">Alles schon vergeben</p>
                  <p className="w-muted">
                    Der andere Wichtel hat alle Wünsche von {receiver.name} gemerkt. Schau später nochmal rein,
                    vielleicht kommt noch etwas dazu.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface Props {
  season: string;
  myId: string;
  receivers: FamilyMember[];
}

export const TheirWishes: React.FC<Props> = ({ season, myId, receivers }) => (
  <div>
    {receivers.map((r) => (
      <ReceiverList key={r.id} season={season} myId={myId} receiver={r} />
    ))}
  </div>
);
