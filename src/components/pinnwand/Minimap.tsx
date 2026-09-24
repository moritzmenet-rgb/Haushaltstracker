import React from 'react';
import type { PostIt, ViewportState } from '../../types/pinnwand';
import { getPostItWidth } from './YarnConnections';

interface MinimapProps {
  postIts: PostIt[];
  viewport: ViewportState;
  containerWidth: number;
  containerHeight: number;
  onNavigate: (x: number, y: number) => void;
}

const MINIMAP_WIDTH = 190;
const MINIMAP_HEIGHT = 130;

export const Minimap: React.FC<MinimapProps> = ({
  postIts,
  viewport,
  containerWidth,
  containerHeight,
  onNavigate
}) => {
  // Compute total bounding box of all post-its + viewport
  const bounds = React.useMemo(() => {
    // Current visible world coordinates
    const viewLeft = -viewport.x / viewport.scale;
    const viewTop = -viewport.y / viewport.scale;
    const viewRight = viewLeft + containerWidth / viewport.scale;
    const viewBottom = viewTop + containerHeight / viewport.scale;

    let minX = Math.min(-200, viewLeft);
    let minY = Math.min(-200, viewTop);
    let maxX = Math.max(1600, viewRight);
    let maxY = Math.max(1200, viewBottom);

    postIts.forEach((p) => {
      const w = getPostItWidth(p.level);
      const h = 200;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + w);
      maxY = Math.max(maxY, p.y + h);
    });

    // Add margin
    const margin = 200;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    const width = Math.max(100, maxX - minX);
    const height = Math.max(100, maxY - minY);

    return { minX, minY, maxX, maxY, width, height };
  }, [postIts, viewport, containerWidth, containerHeight]);

  // Scale factors to map world coordinates to minimap coordinates
  const scaleX = MINIMAP_WIDTH / bounds.width;
  const scaleY = MINIMAP_HEIGHT / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const worldToMap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale,
    y: (y - bounds.minY) * scale
  });

  // Camera viewport box on minimap
  const viewLeft = -viewport.x / viewport.scale;
  const viewTop = -viewport.y / viewport.scale;
  const viewWidth = containerWidth / viewport.scale;
  const viewHeight = containerHeight / viewport.scale;

  const viewPos = worldToMap(viewLeft, viewTop);
  const viewRect = {
    x: Math.max(0, viewPos.x),
    y: Math.max(0, viewPos.y),
    w: Math.min(MINIMAP_WIDTH, viewWidth * scale),
    h: Math.min(MINIMAP_HEIGHT, viewHeight * scale)
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click on minimap to world coordinates
    const worldX = bounds.minX + clickX / scale;
    const worldY = bounds.minY + clickY / scale;

    // Center camera on world coordinate
    const targetX = -worldX * viewport.scale + containerWidth / 2;
    const targetY = -worldY * viewport.scale + containerHeight / 2;

    onNavigate(targetX, targetY);
  };

  const postItMap = React.useMemo(() => {
    const map = new Map<string, PostIt>();
    postIts.forEach(p => map.set(p.id, p));
    return map;
  }, [postIts]);

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <div 
        onClick={handleMinimapClick}
        style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
        className="relative bg-amber-950/80 backdrop-blur-md rounded-2xl border-2 border-amber-800/60 shadow-2xl overflow-hidden cursor-crosshair group"
      >
        {/* Subtle cork grain representation */}
        <div className="absolute inset-0 bg-[#8c5e35]/30 pointer-events-none" />

        {/* Yarn Links on Minimap */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {postIts.map((child) => {
            if (!child.parentId) return null;
            const parent = postItMap.get(child.parentId);
            if (!parent) return null;

            const p1 = worldToMap(parent.x + getPostItWidth(parent.level) / 2, parent.y + 16);
            const p2 = worldToMap(child.x + getPostItWidth(child.level) / 2, child.y + 16);

            return (
              <line
                key={`${parent.id}->${child.id}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#ef4444"
                strokeWidth="1.5"
                opacity="0.85"
              />
            );
          })}
        </svg>

        {/* Post-it representations */}
        {postIts.map((p) => {
          const mapPos = worldToMap(p.x, p.y);
          const w = Math.max(5, getPostItWidth(p.level) * scale);
          const h = Math.max(5, 120 * scale);

          return (
            <div
              key={p.id}
              style={{
                left: `${mapPos.x}px`,
                top: `${mapPos.y}px`,
                width: `${w}px`,
                height: `${h}px`
              }}
              className={`absolute rounded-xs shadow-xs pointer-events-none ${
                p.level === 0 ? 'bg-amber-300 ring-1 ring-amber-500' : 'bg-yellow-200'
              }`}
            />
          );
        })}

        {/* Camera Viewport Indicator Box */}
        <div
          style={{
            left: `${viewRect.x}px`,
            top: `${viewRect.y}px`,
            width: `${viewRect.w}px`,
            height: `${viewRect.h}px`
          }}
          className="absolute border-2 border-white/90 bg-white/10 rounded-sm pointer-events-none shadow-sm transition-all duration-75"
        />

        {/* Badge in top right */}
        <div className="absolute top-1.5 right-2 text-[9px] font-bold text-amber-200/80 pointer-events-none">
          Minimap
        </div>
      </div>
    </div>
  );
};
