import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TreePine } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { getInitials } from '../../utils';
import { placeBranches, type PlacedBranch } from '../treeLayout';
import { useTreeData } from '../useTreeData';
import { WishTree } from './WishTree';
import { MyWishes } from './MyWishes';
import { ReceiverList } from './TheirWishes';

const DESKTOP = '(min-width: 900px)';

function useMedia(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const NameBar: React.FC<{ branches: PlacedBranch[]; focusId: string | null; onFocus: (id: string | null) => void }> = ({
  branches, focusId, onFocus,
}) => (
  <div className="w-namebar" role="toolbar" aria-label="Äste im Wunschbaum">
    <button type="button" className="w-name is-tree" aria-pressed={focusId === null} onClick={() => onFocus(null)}>
      <TreePine className="w-4 h-4" />
      Baum
    </button>
    {branches.map((b) => (
      <button
        key={b.member.id}
        type="button"
        className={`w-name is-${b.role}`}
        aria-pressed={focusId === b.member.id}
        onClick={() => onFocus(b.member.id)}
      >
        <span className="w-avatar w-avatar-sm" style={{ backgroundColor: b.member.avatar_color }}>
          {getInitials(b.member.name)}
        </span>
        {b.role === 'me' ? 'Ich' : b.member.name}
      </button>
    ))}
  </div>
);

const Sealed: React.FC<{ member: FamilyMember; count: number }> = ({ member, count }) => (
  <div className="w-empty w-sealed">
    <div className="w-sealed-envelopes" aria-hidden="true">
      {Array.from({ length: Math.min(count, 8) }, (_, i) => (
        <svg key={i} viewBox="0 0 22 16">
          <rect x="1" y="1" width="20" height="14" rx="1.6" fill="var(--w-blatt)" stroke="var(--w-linie)" strokeWidth="0.7" />
          <path d="M1.6 1.8 L11 9 L20.4 1.8" fill="none" stroke="var(--w-linie)" strokeWidth="0.7" />
          <circle cx="11" cy="9" r="2.3" fill="var(--w-weinrot)" />
        </svg>
      ))}
    </div>
    <p className="w-empty-title">Versiegelt</p>
    <p className="w-muted">
      {count === 0
        ? `${member.name} hat noch keine Wünsche aufgehängt.`
        : `${member.name} hat ${count === 1 ? 'einen Wunsch' : `${count} Wünsche`} aufgehängt. Lesen können sie nur die zwei Wichtel von ${member.name}.`}
    </p>
  </div>
);

interface Props {
  season: string;
  me: FamilyMember;
  members: FamilyMember[];
  receivers: FamilyMember[];
  addWishTrigger: number;
}

/**
 * Wichteln after login: the wish tree with a name bar. Tapping a branch flies the
 * camera there and shows that person's list (on the phone below the tree, on the
 * computer next to it). The phone's back gesture zooms out again.
 */
export const TreeBoard: React.FC<Props> = ({ season, me, members, receivers, addWishTrigger }) => {
  const isDesktop = useMedia(DESKTOP);
  const [focus, setFocus] = useState<string | null>(() => (window.matchMedia?.(DESKTOP).matches ? me.id : null));
  const pushed = useRef(false);
  const treeRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [openRequest, setOpenRequest] = useState(0);
  const [openConsumed, setOpenConsumed] = useState(0);

  const receiverIds = useMemo(() => receivers.map((r) => r.id), [receivers]);
  const branches = useMemo(() => placeBranches(members, me.id, receiverIds), [members, me.id, receiverIds]);
  const data = useTreeData(season, me.id, receiverIds);

  // Back gesture / back button of the phone: zoom out instead of leaving the app
  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      setFocus(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const focusOn = useCallback(
    (id: string | null) => {
      if (!isDesktop) {
        if (id && !pushed.current) {
          window.history.pushState({ wichtelZoom: true }, '');
          pushed.current = true;
        } else if (!id && pushed.current) {
          window.history.back(); // the popstate handler zooms out
          return;
        }
      }
      setFocus(id);
    },
    [isDesktop],
  );

  // Phone: after the camera flight, bring the list into view (with the branch still visible above it)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (isDesktop) return;
    const t = setTimeout(
      () => {
        const el = focus ? detailRef.current : treeRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - (focus ? window.innerHeight * 0.38 : 88);
        window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
      },
      focus ? 520 : 0,
    );
    return () => clearTimeout(t);
  }, [focus, isDesktop]);

  // "Wunsch" in the top bar: fly to my branch and open the sheet
  const lastTrigger = useRef(addWishTrigger);
  useEffect(() => {
    if (addWishTrigger === lastTrigger.current) return;
    lastTrigger.current = addWishTrigger;
    focusOn(me.id);
    setOpenRequest((n) => n + 1);
  }, [addWishTrigger, focusOn, me.id]);

  const focused = branches.find((b) => b.member.id === focus) ?? null;

  let panel: React.ReactNode = null;
  if (focused?.role === 'me') {
    panel = (
      <section aria-label="Meine Wünsche">
        <div className="w-detail-head">
          <h3 className="w-h3">Meine Wünsche</h3>
        </div>
        <MyWishes
          season={season}
          myId={me.id}
          openRequest={openRequest}
          openConsumed={openConsumed}
          onOpenConsumed={setOpenConsumed}
          showFab
          hideTitle
        />
      </section>
    );
  } else if (focused?.role === 'receiver') {
    panel = (
      <section aria-label={`Wünsche von ${focused.member.name}`}>
        <ReceiverList season={season} myId={me.id} receiver={focused.member} />
      </section>
    );
  } else if (focused) {
    panel = <Sealed member={focused.member} count={data.counts[focused.member.id] ?? 0} />;
  } else {
    panel = (
      <p className="w-muted" style={{ textAlign: isDesktop ? 'left' : 'center' }}>
        Tippe auf einen Ast oder oben auf einen Namen. Deine Wichtel-Beschenkten:{' '}
        {receivers.map((r) => r.name).join(' und ')}.
      </p>
    );
  }

  return (
    <div className="w-body">
      <NameBar branches={branches} focusId={focus} onFocus={focusOn} />
      <div className="w-board">
        <div className="w-board-tree" ref={treeRef}>
          <WishTree branches={branches} data={data} focusId={focus} targetY={isDesktop ? 0.42 : 0.6} onFocus={focusOn} />
        </div>
        <div ref={detailRef}>{panel}</div>
      </div>
    </div>
  );
};
