import React from 'react';
import { PinnwandNote } from '../../types';

interface RedThreadCanvasProps {
  notes: PinnwandNote[];
  positions: Record<string, { x: number; y: number }>;
  canvasWidth: number;
  canvasHeight: number;
}

export const RedThreadCanvas: React.FC<RedThreadCanvasProps> = ({
  notes,
  positions,
  canvasWidth,
  canvasHeight
}) => {
  // Helper to determine width based on hierarchy depth
  const getNoteWidth = (depth: number) => {
    if (depth === 0) return 315;
    if (depth === 1) return 275;
    return 245;
  };

  // Find all connection pairs (parent -> child)
  const connections: Array<{
    id: string;
    parentNote: PinnwandNote;
    childNote: PinnwandNote;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }> = [];

  const notesMap = new Map<string, PinnwandNote>();
  notes.forEach((n) => notesMap.set(n.id, n));

  notes.forEach((childNote) => {
    if (!childNote.parentId) return;
    const parentNote = notesMap.get(childNote.parentId);
    if (!parentNote) return;

    const parentPos = positions[parentNote.id] || parentNote.position || { x: 50, y: 50 };
    const childPos = positions[childNote.id] || childNote.position || { x: 350, y: 50 };

    const parentWidth = getNoteWidth(parentNote.depth);
    const childWidth = getNoteWidth(childNote.depth);

    // Pushpins are anchored at the top-center of each post-it
    const x1 = parentPos.x + parentWidth / 2;
    const y1 = parentPos.y + 2;

    const x2 = childPos.x + childWidth / 2;
    const y2 = childPos.y + 2;

    connections.push({
      id: `${parentNote.id}->${childNote.id}`,
      parentNote,
      childNote,
      x1,
      y1,
      x2,
      y2
    });
  });

  return (
    <svg
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0 pointer-events-none z-15 overflow-visible"
      style={{ filter: 'drop-shadow(0 3px 4px rgba(153, 27, 27, 0.45))' }}
      aria-hidden="true"
    >
      <defs>
        {/* Subtle texture gradient for realistic yarn cord */}
        <linearGradient id="redYarnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="70%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Small thread pattern / dashed effect option */}
        <filter id="yarnGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#991b1b" floodOpacity="0.4" />
        </filter>
      </defs>

      {connections.map((conn) => {
        const { id, x1, y1, x2, y2 } = conn;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);

        // Natural physical catenary slack (gravity sag)
        // Sag is proportional to distance, with a gentle minimum and maximum
        const sag = Math.min(90, Math.max(25, dist * 0.14));

        // Control points for cubic bezier
        const cx1 = x1 + dx * 0.32;
        const cy1 = y1 + dy * 0.32 + sag;
        const cx2 = x1 + dx * 0.68;
        const cy2 = y1 + dy * 0.68 + sag;

        const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

        return (
          <g key={id}>
            {/* Soft Ambient Shadow behind the string */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="5"
              strokeLinecap="round"
              transform="translate(1, 3)"
            />

            {/* Core Red Thread / Roter Faden */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#redYarnGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Highlighting fiber reflection for realistic wool/thread texture */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="4 8"
              strokeLinecap="round"
            />

            {/* Yarn knot loop around parent pin */}
            <circle
              cx={x1}
              cy={y1}
              r="4.5"
              fill="none"
              stroke="#991b1b"
              strokeWidth="2.5"
            />

            {/* Yarn knot loop around child pin */}
            <circle
              cx={x2}
              cy={y2}
              r="4.5"
              fill="none"
              stroke="#991b1b"
              strokeWidth="2.5"
            />
          </g>
        );
      })}
    </svg>
  );
};
