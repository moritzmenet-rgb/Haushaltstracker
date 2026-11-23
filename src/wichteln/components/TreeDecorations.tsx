import React, { useEffect, useMemo, useRef, useState } from 'react';
import { adventProgress, adventWindow, candlesLit, ORNAMENTS, type Ornament } from '../advent';

const W = 1000;
const H = 1333.33;
const SEEN_KEY = 'wichteln_kerzen_angezuendet';

const BALL_FILL: Record<NonNullable<Ornament['color']>, string> = {
  rot: 'var(--w-weinrot)',
  gold: 'var(--w-gold)',
  schnee: '#EEF3F5',
};

function wasLightingSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}
function markLightingSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

const Ball: React.FC<{ o: Ornament }> = ({ o }) => (
  <g>
    <line x1="0" y1="-24" x2="0" y2="-13" stroke="var(--w-gold)" strokeWidth="1.4" />
    <rect x="-3.5" y="-14" width="7" height="4.5" rx="1" fill="var(--w-gold)" stroke="var(--w-tinte)" strokeOpacity=".5" strokeWidth=".6" />
    <circle r="11" cy="0" fill={BALL_FILL[o.color ?? 'rot']} stroke="var(--w-tinte)" strokeOpacity=".55" strokeWidth=".9" />
    <circle r="3" cx="-4" cy="-4" fill="#fff" opacity=".5" />
  </g>
);

const Candle: React.FC<{ lit: boolean; delayMs: number; animate: boolean }> = ({ lit, delayMs, animate }) => (
  <g>
    <rect x="-4.5" y="-22" width="9" height="22" rx="1.5" fill="#F4ECDD" stroke="var(--w-tinte)" strokeOpacity=".55" strokeWidth=".8" />
    <line x1="0" y1="-22" x2="0" y2="-26" stroke="var(--w-tinte)" strokeWidth="1" />
    {lit && (
      <g className={animate ? 'w-flame is-lighting' : 'w-flame'} style={animate ? { animationDelay: `${delayMs}ms` } : undefined}>
        <circle cy="-33" r="20" fill="#FFD97A" opacity=".22" filter="url(#w-candle-glow)" />
        <path d="M0 -42 C5 -35 5.5 -30 0 -26 C-5.5 -30 -5 -35 0 -42 Z" fill="var(--w-gold)" />
        <path d="M0 -37 C2.2 -33 2.4 -30.5 0 -28.5 C-2.4 -30.5 -2.2 -33 0 -37 Z" fill="#FFF1C4" />
      </g>
    )}
  </g>
);

const Star: React.FC = () => (
  <path
    d="M0 -28 L7.6 -9.4 L27.6 -8.6 L12 3.8 L17.2 23.2 L0 12.2 L-17.2 23.2 L-12 3.8 L-27.6 -8.6 L-7.6 -9.4 Z"
    fill="var(--w-gold)"
    stroke="var(--w-tinte)"
    strokeOpacity=".55"
    strokeWidth="1.2"
    strokeLinejoin="round"
  />
);

/**
 * Advent decoration on the wish tree. What is visible depends only on the time:
 * bare on 1 December, complete on 24 December 18:00, candles lit from then on.
 * New pieces appearing while the app is open fade in; on opening, the tree is
 * simply shown as it is (no confetti burst).
 */
export const TreeDecorations: React.FC<{ now: Date }> = ({ now }) => {
  const progress = adventProgress(now);
  const lit = candlesLit(now);
  const visible = useMemo(() => ORNAMENTS.filter((o) => o.at <= progress), [progress]);

  // pieces present at first render are shown without animation
  const initial = useRef<Set<string> | null>(null);
  if (initial.current === null) initial.current = new Set(visible.map((o) => o.id));

  // candles light one after another once: on Christmas Eve evening, first time in this session
  const [animateLighting] = useState(() => {
    if (!lit || wasLightingSeen()) return false;
    const eveEnd = adventWindow(now).end + 6 * 3_600_000; // until midnight
    return now.getTime() < eveEnd;
  });
  const wasLit = useRef(lit);
  const [lightingNow, setLightingNow] = useState(animateLighting);
  useEffect(() => {
    if (lightingNow) markLightingSeen();
  }, [lightingNow]);
  useEffect(() => {
    // the app was open while it turned 18:00
    if (lit && !wasLit.current) {
      setLightingNow(true);
      markLightingSeen();
    }
    wasLit.current = lit;
  }, [lit]);

  const garlands = visible.filter((o) => o.kind === 'garland');
  const others = visible.filter((o) => o.kind !== 'garland');
  let candleIndex = 0;

  return (
    <svg className="w-deco" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="w-candle-glow" x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {garlands.map((g) => {
        const x1 = g.x * W, y1 = g.y * H, x2 = (g.x2 ?? g.x) * W, y2 = (g.y2 ?? g.y) * H;
        const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 46;
        return (
          <path
            key={g.id}
            className={initial.current!.has(g.id) ? 'w-orn' : 'w-orn is-new'}
            d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke="var(--w-gold)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray="0.1 10"
            opacity=".95"
          />
        );
      })}
      {others.map((o) => {
        const cls = initial.current!.has(o.id) ? 'w-orn' : 'w-orn is-new';
        const transform = `translate(${(o.x * W).toFixed(1)} ${(o.y * H).toFixed(1)})`;
        // position on the outer group, animation (CSS transform) on the inner one
        let body: React.ReactNode;
        if (o.kind === 'ball') body = <Ball o={o} />;
        else if (o.kind === 'candle') {
          const i = candleIndex++;
          body = <Candle lit={lit} animate={lightingNow} delayMs={i * 380} />;
        } else body = <Star />;
        return (
          <g key={o.id} transform={transform}>
            <g className={cls}>{body}</g>
          </g>
        );
      })}
    </svg>
  );
};
