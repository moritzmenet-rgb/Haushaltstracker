import { useEffect, useState } from 'react';
import { USE_EMULATORS } from '../firebase';
import { currentSeason } from './season';

/**
 * Advent progress of the wish tree.
 * progress = time since 1 December 00:00 / time until 24 December 18:00 (local time).
 * Every ornament has a fixed moment in that range, so the tree fills evenly and is
 * complete exactly on Christmas Eve; at 18:00 the candles are lit.
 */
export function adventWindow(now: Date) {
  const year = Number(currentSeason(now));
  return {
    start: new Date(year, 11, 1, 0, 0, 0).getTime(),
    end: new Date(year, 11, 24, 18, 0, 0).getTime(),
  };
}

export function adventProgress(now: Date): number {
  const { start, end } = adventWindow(now);
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

export function candlesLit(now: Date): boolean {
  return now.getTime() >= adventWindow(now).end;
}

/** Local test mode only: `?zeit=2026-12-12T15:00` shows the tree at another time. */
function timeOverride(): Date | null {
  if (!USE_EMULATORS || typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('zeit');
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Current time, refreshed every minute (so ornaments appear while the app is open). */
export function useAdventClock(): Date {
  const [now, setNow] = useState(() => timeOverride() ?? new Date());
  useEffect(() => {
    if (timeOverride()) return;
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ---------------------------------------------------------------------------
// Ornament layout, measured on assets/wunschbaum.webp (fractions of the picture)
// ---------------------------------------------------------------------------

export type OrnamentKind = 'ball' | 'candle' | 'garland' | 'star';

export interface Ornament {
  id: string;
  kind: OrnamentKind;
  x: number;
  y: number;
  /** ball colour / garland end point */
  color?: 'rot' | 'gold' | 'schnee';
  x2?: number;
  y2?: number;
  /** progress (0..1) at which it appears */
  at: number;
}

// Baubles on the inner foliage of each tier (wish tags hang further out, below)
const BALLS: Array<[number, number, Ornament['color']]> = [
  // tier 2
  [0.44, 0.255, 'rot'], [0.57, 0.262, 'gold'],
  // tier 3
  [0.35, 0.362, 'gold'], [0.47, 0.37, 'schnee'], [0.6, 0.358, 'rot'], [0.68, 0.372, 'gold'],
  // tier 4
  [0.27, 0.49, 'rot'], [0.39, 0.5, 'gold'], [0.52, 0.485, 'rot'], [0.64, 0.498, 'schnee'], [0.74, 0.487, 'gold'],
  // tier 5
  [0.22, 0.62, 'gold'], [0.33, 0.632, 'schnee'], [0.45, 0.618, 'rot'], [0.57, 0.63, 'gold'], [0.68, 0.62, 'rot'], [0.79, 0.628, 'schnee'],
  // tier 6
  [0.24, 0.752, 'rot'], [0.37, 0.762, 'gold'], [0.5, 0.748, 'schnee'], [0.63, 0.76, 'rot'], [0.76, 0.75, 'gold'],
];

// Candles clipped onto the branch tips (base of the candle = this point)
const CANDLES: Array<[number, number]> = [
  [0.37, 0.226], [0.633, 0.234],
  [0.29, 0.336], [0.714, 0.344],
  [0.22, 0.47], [0.777, 0.477],
  [0.172, 0.612], [0.818, 0.608],
  [0.117, 0.757], [0.883, 0.757],
];

// Gold garlands swinging across a tier (left end -> right end)
const GARLANDS: Array<[number, number, number, number]> = [
  [0.33, 0.33, 0.67, 0.335],
  [0.26, 0.455, 0.75, 0.46],
  [0.2, 0.58, 0.81, 0.585],
  [0.16, 0.71, 0.85, 0.712],
];

function buildOrnaments(): Ornament[] {
  const list: Omit<Ornament, 'at'>[] = [
    ...BALLS.map(([x, y, color], i) => ({ id: `b${i}`, kind: 'ball' as const, x, y, color })),
    ...CANDLES.map(([x, y], i) => ({ id: `c${i}`, kind: 'candle' as const, x, y })),
    ...GARLANDS.map(([x, y, x2, y2], i) => ({ id: `g${i}`, kind: 'garland' as const, x, y, x2, y2 })),
  ];
  // Fixed, evenly mixed order (deterministic, the same on every device)
  let seed = 20261224;
  const rand = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed / 4294967296;
  };
  const shuffled = list
    .map((o) => ({ o, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map(({ o }) => o);
  const total = shuffled.length + 1; // + star
  const placed = shuffled.map((o, i) => ({ ...o, at: (i + 1) / total }));
  placed.push({ id: 'star', kind: 'star', x: 0.5, y: 0.035, at: 1 });
  return placed;
}

export const ORNAMENTS: Ornament[] = buildOrnaments();
