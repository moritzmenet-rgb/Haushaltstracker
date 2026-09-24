import React from 'react';
import type { PostIt } from '../../types/pinnwand';

interface YarnConnectionsProps {
  postIts: PostIt[];
}

export const getPostItWidth = (level: number): number => {
  if (level === 0) return 310;
  if (level === 1) return 250;
  return 210;
};

export const getPinPosition = (postIt: PostIt): { x: number; y: number } => {
  const width = getPostItWidth(postIt.level);
  return {
    x: postIt.x + width / 2,
    y: postIt.y + 16
  };
};

export const YarnConnections: React.FC<YarnConnectionsProps> = ({ postIts }) => {
  // Create quick lookup map
  const postItMap = React.useMemo(() => {
    const map = new Map<string, PostIt>();
    postIts.forEach(p => map.set(p.id, p));
    return map;
  }, [postIts]);

  // Compute all links
  const links = React.useMemo(() => {
    const result: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      pathD: string;
      level: number;
    }> = [];

    postIts.forEach((child) => {
      if (!child.parentId) return;
      const parent = postItMap.get(child.parentId);
      if (!parent) return;

      const p1 = getPinPosition(parent);
      const p2 = getPinPosition(child);

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Natural gravity sag calculation (curves gracefully downward like wool thread)
      const sag = Math.min(95, Math.max(25, dist * 0.15));

      const cx1 = p1.x + dx * 0.25;
      const cy1 = p1.y + dy * 0.25 + sag;
      const cx2 = p2.x - dx * 0.25;
      const cy2 = p2.y - dy * 0.25 + sag;

      const pathD = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

      result.push({
        id: `${parent.id}->${child.id}`,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        pathD,
        level: child.level
      });
    });

    return result;
  }, [postIts, postItMap]);

  if (links.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-10 overflow-visible w-full h-full"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Soft shadow for the wool thread lying or hanging above the cork */}
        <filter id="yarn-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.45" />
        </filter>

        <linearGradient id="yarn-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {links.map((link) => (
        <g key={link.id} className="yarn-connection-group">
          {/* Base shadow layer */}
          <path
            d={link.pathD}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="4"
            strokeLinecap="round"
            className="transform translate-y-1.5 translate-x-1"
          />

          {/* Main Red Wool Thread */}
          <path
            d={link.pathD}
            fill="none"
            stroke="url(#yarn-gradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Highlighting fiber strand (gives authentic twisted yarn look) */}
          <path
            d={link.pathD}
            fill="none"
            stroke="#fca5a5"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Small knot / ring around origin pushpin */}
          <circle
            cx={link.x1}
            cy={link.y1}
            r="4.5"
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2.5"
            opacity="0.9"
          />

          {/* Small knot / ring around target pushpin */}
          <circle
            cx={link.x2}
            cy={link.y2}
            r="4.5"
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2.5"
            opacity="0.9"
          />
        </g>
      ))}
    </svg>
  );
};
