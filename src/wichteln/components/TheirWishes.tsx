import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Gift, Users } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { getInitials } from '../../utils';
import { haptic } from '../../utils/haptics';
import {
  answerConnect,
  claimWish,
  removeConnect,
  requestConnect,
  subscribeClaimsFor,
  subscribeConnectsFor,
  subscribeWishesOf,
  unclaimWish,
} from '../wichtelService';
import type { ConnectRequest, Wish, WishClaim } from '../types';
import { WishCard } from './WishCard';
import geschenkeUrl from '../assets/wichtel-geschenke.webp';

interface ReceiverProps {
  season: string;
  myId: string;
  receiver: FamilyMember;
  /** all family members, only to name the partner AFTER a pooling request was accepted */
  members?: FamilyMember[];
}

/** a claim is "mine" if I claimed it, alone or pooled with the other Wichtel */
const isMine = (c: WishClaim | undefined, myId: string) => !!c && (c.claimed_by === myId || c.with_id === myId);

/**
 * One person I gift. Wishes the other Wichtel took are left out completely; my own
 * (or pooled) claims stay visible in green with the stamp. "Zusammenlegen" asks the
 * other Wichtel anonymously; names are only shown after a "yes".
 */
export const ReceiverList: React.FC<ReceiverProps> = ({ season, myId, receiver, members = [] }) => {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [claims, setClaims] = useState<Record<string, WishClaim>>({});
  const [connects, setConnects] = useState<Record<string, ConnectRequest>>({});
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
  useEffect(() => subscribeConnectsFor(season, receiver.id, setConnects, () => undefined), [season, receiver.id]);

  const nameOf = (id?: string | null) => members.find((m) => m.id === id)?.name ?? 'der andere Wichtel';

  /** "(bearbeitet)" shows on every card; this extra note only if I had already taken the wish. */
  const editedNote = (w: Wish) => {
    const at = w.edited_at ? Date.parse(w.edited_at) : NaN;
    if (Number.isNaN(at)) return null;
    const claim = claims[w.id];
    if (claim && isMine(claim, myId) && Date.parse(claim.claimed_at) < at) {
      return 'Die Beschreibung wurde geändert, nachdem du den Wunsch gemerkt hast.';
    }
    return null;
  };

  const run = async (wishId: string, fn: () => Promise<void>) => {
    if (pending) return;
    setPending(wishId);
    setError(null);
    try {
      await fn();
    } catch {
      setError('Das hat nicht geklappt. Versuch es nochmal.');
    } finally {
      setPending(null);
    }
  };

  const toggle = (wish: Wish) =>
    run(wish.id, async () => {
      if (isMine(claims[wish.id], myId)) {
        await unclaimWish(season, wish.id);
        haptic.light();
      } else {
        const ok = await claimWish(season, wish, myId);
        if (ok) haptic.success();
        else setError('Da war jemand schneller. Dieser Wunsch ist schon vergeben.');
      }
    });

  const ask = (wish: Wish) =>
    run(wish.id, async () => {
      const ok = await requestConnect(season, wish, myId);
      if (!ok) setError('Für diesen Wunsch gibt es schon eine Anfrage.');
      else haptic.light();
    });

  const answer = (req: ConnectRequest, yes: boolean) =>
    run(req.wish_id, async () => {
      await answerConnect(season, req, myId, yes, claims[req.wish_id]);
      if (yes) haptic.success();
    });

  if (wishes === null && !error) return <div className="w-spinner" aria-label="Wird geladen" />;

  const all = wishes ?? [];
  const visible = all.filter((w) => !claims[w.id] || isMine(claims[w.id], myId));
  const openCount = all.filter((w) => !claims[w.id]).length;
  const myCount = all.filter((w) => isMine(claims[w.id], myId)).length;

  /** The small row under a card about pooling. Names appear only after a "yes". */
  const connectRow = (w: Wish) => {
    const req = connects[w.id];
    const claim = claims[w.id];
    if (claim?.with_id && isMine(claim, myId)) {
      const partner = claim.claimed_by === myId ? claim.with_id : claim.claimed_by;
      return (
        <div className="w-connect-row">
          <span>
            <Users className="w-4 h-4" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 4 }} />
            Ihr legt zusammen: du und {nameOf(partner)}
          </span>
        </div>
      );
    }
    if (!req) {
      if (claim) return null; // I took it alone; the other Wichtel cannot see it anyway
      return (
        <div className="w-connect-row">
          <span>Zu gross für dich allein?</span>
          <button type="button" className="w-link" onClick={() => ask(w)} disabled={pending === w.id}>
            Mit dem anderen Wichtel zusammenlegen
          </button>
        </div>
      );
    }
    if (req.status === 'pending' && req.from_id === myId) {
      return (
        <div className="w-connect-row">
          <span>Anfrage an den anderen Wichtel gesendet. Er sieht sie beim nächsten Öffnen.</span>
          <button type="button" className="w-link" onClick={() => run(w.id, () => removeConnect(season, w.id))}>
            Zurückziehen
          </button>
        </div>
      );
    }
    if (req.status === 'pending') {
      // asked by the other Wichtel: who it is stays secret until "yes"
      return (
        <div className="w-connect-row is-ask" role="group" aria-label="Anfrage zum Zusammenlegen">
          <span>Ein Wichtel möchte bei diesem Wunsch mit dir zusammenlegen.</span>
          <span className="w-connect-actions">
            <button type="button" className="w-btn w-btn-primary w-btn-small" onClick={() => answer(req, true)} disabled={pending === w.id}>
              Ja, gerne
            </button>
            <button type="button" className="w-btn w-btn-ghost w-btn-small" onClick={() => answer(req, false)} disabled={pending === w.id}>
              Nein, danke
            </button>
          </span>
        </div>
      );
    }
    if (req.status === 'declined' && req.from_id === myId) {
      return (
        <div className="w-connect-row">
          <span>Der andere Wichtel hat schon eigene Ideen für dieses Geschenk.</span>
          <button type="button" className="w-link" onClick={() => run(w.id, () => removeConnect(season, w.id))}>
            OK
          </button>
        </div>
      );
    }
    return null;
  };

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
                const mine = isMine(claims[w.id], myId);
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
                      editedNote={editedNote(w)}
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
                    {connectRow(w)}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
          {openCount === 0 && (
            <div className="w-empty" style={{ marginTop: visible.length ? 16 : 0 }}>
              {myCount > 0 ? (
                <>
                  <img className="w-empty-figure" src={geschenkeUrl} alt="" width={168} height={168} />
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
  members?: FamilyMember[];
}

export const TheirWishes: React.FC<Props> = ({ season, myId, receivers, members }) => (
  <div>
    {receivers.map((r) => (
      <ReceiverList key={r.id} season={season} myId={myId} receiver={r} members={members} />
    ))}
  </div>
);
