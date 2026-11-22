import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Snowflake } from 'lucide-react';
import dorfUrl from '../assets/wichteln-dorf.webp';

const SNOW_KEY = 'wichteln_snow';

function readSnowPref(): boolean {
  try {
    return localStorage.getItem(SNOW_KEY) !== 'off';
  } catch {
    return true;
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** A few slow, sparse flakes, only inside the header. Positions are fixed per mount. */
const Snow: React.FC = () => {
  const flakes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: Math.round((i * 4.6 + Math.random() * 4) * 10) / 10,
        size: 2 + Math.random() * 2.5,
        duration: 9 + Math.random() * 8,
        delay: -Math.random() * 16,
        drift: (Math.random() - 0.5) * 24,
      })),
    [],
  );
  return (
    <div className="w-snow" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            ['--drift' as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

/** One tiered fir (three layers of branches and a short trunk), apex at (cx, top). */
function firPath(cx: number, top: number, h: number, b: number): string {
  const y = (f: number) => (top + h * f).toFixed(1);
  const x = (f: number) => (cx + b * f).toFixed(1);
  const base = 40;
  return [
    `M${x(0)} ${y(0)}`,
    `L${x(0.55)} ${y(0.38)} L${x(0.3)} ${y(0.36)}`,
    `L${x(0.8)} ${y(0.68)} L${x(0.48)} ${y(0.66)}`,
    `L${x(1)} ${y(0.94)} L${x(0.12)} ${y(0.94)} L${x(0.12)} ${base}`,
    `L${x(-0.12)} ${base} L${x(-0.12)} ${y(0.94)} L${x(-1)} ${y(0.94)}`,
    `L${x(-0.48)} ${y(0.66)} L${x(-0.8)} ${y(0.68)}`,
    `L${x(-0.3)} ${y(0.36)} L${x(-0.55)} ${y(0.38)} Z`,
  ].join(' ');
}

// [centre, height, half width] – irregular on purpose, so it looks hand-placed
const FIRS: Array<[number, number, number]> = [
  [14, 22, 8], [34, 30, 10], [52, 18, 6.5], [96, 26, 9], [118, 34, 11], [140, 20, 7],
  [188, 28, 9.5], [208, 18, 6], [252, 32, 10.5], [274, 22, 7.5], [320, 26, 9], [342, 34, 11], [366, 19, 6.5],
];
const STARS: Array<[number, number]> = [[72, 8], [168, 5], [232, 11], [300, 6], [388, 9]];

/** Row of small firs, repeated at natural size along the strip (never stretched). */
export const FirSilhouette: React.FC = () => {
  const id = `w-firs-${React.useId().replace(/:/g, '')}`;
  return (
    <svg className="w-firs" height="40" aria-hidden="true">
      <defs>
        <pattern id={id} width="400" height="40" patternUnits="userSpaceOnUse">
          <g fill="currentColor">
            {FIRS.map(([cx, h, b], i) => (
              <path key={i} d={firPath(cx, 40 - h, h, b)} />
            ))}
          </g>
          <g fill="var(--w-gold)">
            {STARS.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={1.2} />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="40" fill={`url(#${id})`} />
    </svg>
  );
};

interface Props {
  countdown: string;
  right?: React.ReactNode;
}

/**
 * Picture-book header: the village illustration with title and countdown.
 * When it scrolls out of view, a narrow fir strip stays at the top instead.
 */
export const WichtelHeader: React.FC<Props> = ({ countdown, right }) => {
  const headerRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [snowOn, setSnowOn] = useState(() => readSnowPref());
  const reduced = prefersReducedMotion();

  // The strip appears once the picture has scrolled away
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The strip is fixed to the top of the window, as wide as the Wichteln area
  useEffect(() => {
    const area = headerRef.current?.closest('.wichteln') as HTMLElement | null;
    if (!area) return;
    const measure = () => {
      const r = area.getBoundingClientRect();
      setBox({ left: r.left + 1, width: r.width - 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(area);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, []);

  const toggleSnow = () => {
    setSnowOn((v) => {
      const next = !v;
      try {
        localStorage.setItem(SNOW_KEY, next ? 'on' : 'off');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <>
      <div
        className={`w-strip ${compact ? 'is-visible' : ''}`}
        aria-hidden="true"
        style={box ? { left: box.left, width: box.width } : undefined}
      >
        <FirSilhouette />
        <span className="w-strip-title">Wichteln</span>
      </div>

      <header ref={headerRef} className="w-hero">
        <img className="w-hero-img" src={dorfUrl} alt="" width={1600} height={900} decoding="async" />
        {snowOn && !reduced && <Snow />}
        <div className="w-hero-text">
          <h1 className="w-title">Wichteln</h1>
          <div className="w-countdown">{countdown}</div>
        </div>
        <div className="w-hero-tools">
          {right}
          {!reduced && (
            <button
              type="button"
              className="w-icon-btn"
              onClick={toggleSnow}
              aria-pressed={snowOn}
              title={snowOn ? 'Schneefall ausschalten' : 'Schneefall einschalten'}
            >
              <Snowflake className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    </>
  );
};
