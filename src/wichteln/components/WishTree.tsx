import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import baumUrl from '../assets/wunschbaum.webp';
import { branchFocus, MAX_ON_BRANCH, type PlacedBranch } from '../treeLayout';
import type { TreeData } from '../useTreeData';
import type { Wish, WishClaim } from '../types';
import { useAdventClock } from '../advent';
import { TreeDecorations } from './TreeDecorations';

const ZOOM = 2.2;
/** How much a layer follows the camera: sky lags behind, foreground snow rushes ahead */
const DEPTH = { back: 0.35, mid: 1, front: 1.18 };
const PAN_FACTOR = { back: 0.3, mid: 1, front: 1.6 };
const MAX_PAN = 28;
const STRING_LEN = [0.36, 0.62, 0.45, 0.72, 0.4, 0.56];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function layerTransform(zoom: number, depth: number, fx: number, fy: number, targetY: number, pan: number, panFactor: number) {
  const s = 1 + (zoom - 1) * depth;
  const tx = clamp(0.5 - fx * s, 1 - s, 0);
  const ty = clamp(targetY - fy * s, 1 - s, 0);
  return `translate(calc(${(tx * 100).toFixed(3)}% + ${(pan * panFactor).toFixed(1)}px), ${(ty * 100).toFixed(3)}%) scale(${s.toFixed(4)})`;
}

const MiniTag: React.FC<{ position: number; claimed?: boolean }> = ({ position, claimed }) => (
  <svg className="w-mini-tag" viewBox="0 0 20 26" aria-hidden="true">
    <path
      d="M4 6.5 L10 2 L16 6.5 L16 23.5 Q16 25 14.5 25 L5.5 25 Q4 25 4 23.5 Z"
      fill={claimed ? 'var(--w-tanne)' : 'var(--w-blatt)'}
      stroke={claimed ? 'var(--w-tanne)' : 'var(--w-linie)'}
      strokeWidth="0.7"
    />
    <circle cx="10" cy="6.6" r="1.25" fill="var(--w-papier)" stroke="var(--w-linie)" strokeWidth="0.4" />
    {claimed ? (
      <path d="M7 16.5 l2.2 2.2 L13.5 14" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <text
        x="10"
        y="19.2"
        textAnchor="middle"
        fontSize="8"
        fontFamily="Newsreader, Georgia, serif"
        fill={position === 1 ? 'var(--w-weinrot)' : 'var(--w-bleistift)'}
      >
        {position}
      </text>
    )}
  </svg>
);

const Envelope: React.FC = () => (
  <svg className="w-mini-envelope" viewBox="0 0 22 16" aria-hidden="true">
    <rect x="1" y="1" width="20" height="14" rx="1.6" fill="var(--w-blatt)" stroke="var(--w-linie)" strokeWidth="0.7" />
    <path d="M1.6 1.8 L11 9 L20.4 1.8" fill="none" stroke="var(--w-linie)" strokeWidth="0.7" />
    <circle cx="11" cy="9" r="2.3" fill="var(--w-weinrot)" />
  </svg>
);

interface Hanging {
  key: string;
  node: React.ReactNode;
  isNew?: boolean;
}

interface BranchProps {
  branch: PlacedBranch;
  items: Hanging[];
  extra: number;
  label: string;
  dim: boolean;
  focused: boolean;
  onSelect: () => void;
}

const Branch: React.FC<BranchProps> = ({ branch, items, extra, label, dim, focused, onSelect }) => {
  const { slot, role } = branch;
  const step = (slot.x1 - slot.x0) / MAX_ON_BRANCH;
  // start at the outer tip and work inwards towards the trunk
  const xAt = (i: number) => (slot.side === 'left' ? slot.x0 + step * (i + 0.5) : slot.x1 - step * (i + 0.5));
  const labelX = slot.side === 'left' ? slot.x0 : slot.x1;
  // bigger things on long branches, never so big that neighbours overlap
  const itemSize = Math.min(5.4, step * 100 * 0.92);
  return (
    <div
      className={`w-branch is-${role} ${dim ? 'is-dim' : ''} ${focused ? 'is-focused' : ''}`}
      style={{ ['--w-item' as string]: `${itemSize.toFixed(2)}cqw` }}
    >
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`w-hang ${item.isNew ? 'is-new' : ''}`}
          style={{ left: `${xAt(i) * 100}%`, top: `${slot.y * 100}%` }}
        >
          <span className="w-hang-string" style={{ height: `${slot.drop * STRING_LEN[i % STRING_LEN.length] * 133.33}cqw` }} />
          {item.node}
        </div>
      ))}
      {extra > 0 && (
        <span
          className="w-branch-more"
          style={{ left: `${xAt(Math.min(items.length, MAX_ON_BRANCH - 1)) * 100}%`, top: `${(slot.y + slot.drop * 0.55) * 100}%` }}
        >
          +{extra}
        </span>
      )}
      <span className="w-branch-label" style={{ left: `${labelX * 100}%`, top: `${(slot.y - 0.05) * 100}%` }}>
        {label}
      </span>
      <button
        type="button"
        className="w-branch-hit"
        style={{
          left: `${slot.x0 * 100}%`,
          width: `${(slot.x1 - slot.x0) * 100}%`,
          top: `${(slot.y - 0.07) * 100}%`,
          height: `${(slot.drop + 0.07) * 100}%`,
        }}
        onClick={onSelect}
        aria-label={role === 'me' ? 'Dein Ast mit deinen Wünschen' : `Ast von ${label}`}
      />
    </div>
  );
};

interface Props {
  branches: PlacedBranch[];
  data: TreeData;
  focusId: string | null;
  /** vertical spot (0..1 of the tree box) where the focused branch ends up */
  targetY: number;
  onFocus: (memberId: string | null) => void;
}

/**
 * The wish tree: every family member has a branch. Mine and the two people I gift
 * are bright with small gift tags; everybody else's branch is further back with
 * sealed envelopes (only the number of wishes, never whether something is taken).
 */
export const WishTree: React.FC<Props> = ({ branches, data, focusId, targetY, onFocus }) => {
  const now = useAdventClock();
  const [pan, setPan] = useState(0);
  const [panning, setPanning] = useState(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Tags of my own wishes that appear after the first load float onto the branch
  const knownMine = useRef<Set<string> | null>(null);
  const newMine = useMemo(() => {
    if (!data.myLoaded) return new Set<string>();
    if (!knownMine.current) {
      knownMine.current = new Set(data.myWishes.map((w) => w.id));
      return new Set<string>();
    }
    const fresh = new Set<string>();
    data.myWishes.forEach((w) => {
      if (!knownMine.current!.has(w.id)) fresh.add(w.id);
    });
    return fresh;
  }, [data.myLoaded, data.myWishes]);
  useEffect(() => {
    if (newMine.size === 0) return;
    const t = setTimeout(() => newMine.forEach((id) => knownMine.current?.add(id)), 1200);
    return () => clearTimeout(t);
  }, [newMine]);

  const focused = branches.find((b) => b.member.id === focusId) ?? null;
  const zoom = focused ? ZOOM : 1;
  const f = focused ? branchFocus(focused.slot) : { x: 0.5, y: 0.5 };
  const tf = (layer: keyof typeof DEPTH) => layerTransform(zoom, DEPTH[layer], f.x, f.y, targetY, pan, PAN_FACTOR[layer]);

  // Swipe sideways (overview only): the layers move at different speeds -> depth
  const onPointerDown = (e: React.PointerEvent) => {
    if (focused) return;
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (!drag.current.moved && Math.abs(dx) > 6) {
      drag.current.moved = true;
      setPanning(true);
    }
    if (drag.current.moved) setPan(clamp(dx * 0.35, -MAX_PAN, MAX_PAN));
  };
  const endDrag = () => {
    if (drag.current?.moved) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
    }
    drag.current = null;
    setPanning(false);
    setPan(0);
  };

  const select = (id: string) => {
    if (suppressClick.current) return;
    onFocus(id === focusId ? null : id);
  };

  const itemsFor = (b: PlacedBranch): { items: Hanging[]; extra: number } => {
    if (b.role === 'me') {
      const list = data.myWishes;
      return {
        items: list.slice(0, MAX_ON_BRANCH).map((w, i) => ({
          key: w.id,
          node: <MiniTag position={i + 1} />,
          isNew: newMine.has(w.id),
        })),
        extra: Math.max(0, list.length - MAX_ON_BRANCH),
      };
    }
    if (b.role === 'receiver') {
      const all: Wish[] = data.receiverWishes[b.member.id] ?? [];
      const claims = data.receiverClaims[b.member.id] ?? {};
      const meId = branches.find((x) => x.role === 'me')?.member.id;
      // what the other Wichtel took is gone here too, exactly like in the list
      const mineClaim = (c?: WishClaim) => !!c && (c.claimed_by === meId || c.with_id === meId);
      const visible = all.filter((w) => !claims[w.id] || mineClaim(claims[w.id]));
      return {
        items: visible.slice(0, MAX_ON_BRANCH).map((w) => ({
          key: w.id,
          node: <MiniTag position={all.indexOf(w) + 1} claimed={mineClaim(claims[w.id])} />,
        })),
        extra: Math.max(0, visible.length - MAX_ON_BRANCH),
      };
    }
    const n = data.counts[b.member.id] ?? 0;
    return {
      items: Array.from({ length: Math.min(n, MAX_ON_BRANCH) }, (_, i) => ({ key: `env-${i}`, node: <Envelope /> })),
      extra: Math.max(0, n - MAX_ON_BRANCH),
    };
  };

  return (
    <div
      className={`w-tree ${focused ? 'is-zoomed' : ''} ${panning ? 'is-panning' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="w-tree-layer w-tree-back" style={{ transform: tf('back') }} aria-hidden="true">
        {[
          [12, 9], [28, 16], [71, 7], [86, 18], [56, 4], [8, 30], [93, 33],
        ].map(([x, y], i) => (
          <span key={i} className="w-tree-star" style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
      </div>

      <div className="w-tree-layer w-tree-mid" style={{ transform: tf('mid') }}>
        <img className="w-tree-img" src={baumUrl} alt="" width={900} height={1200} decoding="async" draggable={false} />
        <TreeDecorations now={now} />
        {branches.map((b) => {
          const { items, extra } = itemsFor(b);
          return (
            <Branch
              key={b.member.id}
              branch={b}
              items={items}
              extra={extra}
              label={b.role === 'me' ? 'Ich' : b.member.name}
              dim={!!focused && focused.member.id !== b.member.id}
              focused={focused?.member.id === b.member.id}
              onSelect={() => select(b.member.id)}
            />
          );
        })}
      </div>

      <div className="w-tree-layer w-tree-front" style={{ transform: tf('front') }} aria-hidden="true">
        <svg className="w-tree-drift" viewBox="0 0 300 40" preserveAspectRatio="none">
          <path d="M0 22 C40 12 70 20 110 16 C150 12 190 24 230 18 C260 14 285 16 300 12 L300 40 L0 40 Z" fill="var(--w-schnee)" opacity="0.55" />
          <path d="M0 30 C50 22 90 30 140 26 C190 22 240 32 300 24 L300 40 L0 40 Z" fill="var(--w-papier)" />
        </svg>
        <span className="w-tree-flake" style={{ left: '6%', top: '58%' }} />
        <span className="w-tree-flake is-big" style={{ left: '90%', top: '42%' }} />
        <span className="w-tree-flake" style={{ left: '82%', top: '84%' }} />
      </div>

      {focused && (
        <button type="button" className="w-tree-back-btn" onClick={() => onFocus(null)}>
          <ArrowLeft className="w-4 h-4" />
          Zum Baum
        </button>
      )}
    </div>
  );
};
