import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { PostIt, ViewportState } from '../../types/pinnwand';
import { YarnConnections, getPostItWidth } from './YarnConnections';
import { PostItNode } from './PostItNode';
import { CanvasControls } from './CanvasControls';
import { Minimap } from './Minimap';

interface CorkCanvasProps {
  postIts: PostIt[];
  currentUserId: string;
  searchQuery: string;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onReply: (parent: PostIt) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: PostIt) => void;
  onVote: (postItId: string, optionId: string) => void;
  onReact: (postItId: string, emoji: string) => void;
}

export const CorkCanvas: React.FC<CorkCanvasProps> = ({
  postIts,
  currentUserId,
  searchQuery,
  onUpdatePosition,
  onReply,
  onDelete,
  onUpdate,
  onVote,
  onReact
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State (Panning & Zooming)
  const [viewport, setViewport] = useState<ViewportState>({
    x: 100,
    y: 120,
    scale: 0.95
  });

  const [containerSize, setContainerSize] = useState({ width: 1400, height: 900 });
  const [showMinimap, setShowMinimap] = useState(true);

  // Dragging State for Post-it
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Local optimistic positions while dragging for 60fps silky smooth yarn updates
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Panning State for Canvas
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; viewX: number; viewY: number }>({
    clientX: 0,
    clientY: 0,
    viewX: 0,
    viewY: 0
  });

  // Touch pinch state
  const touchInfoRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialMidX: number;
    initialMidY: number;
  } | null>(null);

  // Resize observer for container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Set of parent IDs that currently have children (for pushpin yarn knot display)
  const parentIdSet = React.useMemo(() => {
    const set = new Set<string>();
    postIts.forEach(p => {
      if (p.parentId) set.add(p.parentId);
    });
    return set;
  }, [postIts]);

  // Merge Firestore post-its with active dragging local positions
  const displayPostIts = React.useMemo(() => {
    return postIts.map((p) => {
      if (localPositions[p.id]) {
        return {
          ...p,
          x: localPositions[p.id].x,
          y: localPositions[p.id].y
        };
      }
      return p;
    });
  }, [postIts, localPositions]);

  // --------------------------------------------------------------------------
  // PANNING HANDLERS (Canvas Background Drag)
  // --------------------------------------------------------------------------
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only start pan if clicking directly on cork canvas or background SVG
    const target = e.target as HTMLElement;
    if (
      target.closest('.postit-shadow') || 
      target.closest('button') || 
      target.closest('input') ||
      target.closest('header')
    ) {
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      viewX: viewport.x,
      viewY: viewport.y
    };
  };

  // --------------------------------------------------------------------------
  // POST-IT DRAG & DROP HANDLERS
  // --------------------------------------------------------------------------
  const handlePostItDragStart = useCallback((
    id: string, 
    startX: number, 
    startY: number, 
    clientX: number, 
    clientY: number
  ) => {
    setDraggedNoteId(id);
    dragInfoRef.current = {
      id,
      startX,
      startY,
      startClientX: clientX,
      startClientY: clientY,
      currentX: startX,
      currentY: startY
    };
  }, []);

  // Global PointerMove and PointerUp to handle both canvas pan & post-it drag seamlessly
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      // 1. If dragging a Post-it
      if (dragInfoRef.current) {
        const { startX, startY, startClientX, startClientY, id } = dragInfoRef.current;
        const dx = (e.clientX - startClientX) / viewport.scale;
        const dy = (e.clientY - startClientY) / viewport.scale;
        
        const newX = Math.round(startX + dx);
        const newY = Math.round(startY + dy);

        dragInfoRef.current.currentX = newX;
        dragInfoRef.current.currentY = newY;

        setLocalPositions(prev => ({
          ...prev,
          [id]: { x: newX, y: newY }
        }));
        return;
      }

      // 2. If panning the Canvas
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.clientX;
        const dy = e.clientY - panStartRef.current.clientY;

        setViewport(prev => ({
          ...prev,
          x: panStartRef.current.viewX + dx,
          y: panStartRef.current.viewY + dy
        }));
      }
    };

    const handleGlobalPointerUp = () => {
      // Finalize Post-it drag
      if (dragInfoRef.current) {
        const { id, currentX, currentY } = dragInfoRef.current;
        onUpdatePosition(id, currentX, currentY);

        dragInfoRef.current = null;
        setDraggedNoteId(null);
        // Clear local drag position override
        setLocalPositions(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }

      if (isPanning) {
        setIsPanning(false);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isPanning, viewport.scale, onUpdatePosition]);

  // --------------------------------------------------------------------------
  // ZOOM HANDLERS (Wheel at Cursor Position & Buttons)
  // --------------------------------------------------------------------------
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom step factor
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(2.5, Math.max(0.25, viewport.scale * zoomFactor));

    if (newScale === viewport.scale) return;

    // Focus zoom at cursor
    const scaleRatio = newScale / viewport.scale;
    const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
    const newY = mouseY - (mouseY - viewport.y) * scaleRatio;

    setViewport({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  const handleZoomIn = () => {
    const centerPointX = containerSize.width / 2;
    const centerPointY = containerSize.height / 2;
    const newScale = Math.min(2.5, viewport.scale * 1.2);
    const scaleRatio = newScale / viewport.scale;

    setViewport({
      x: centerPointX - (centerPointX - viewport.x) * scaleRatio,
      y: centerPointY - (centerPointY - viewport.y) * scaleRatio,
      scale: newScale
    });
  };

  const handleZoomOut = () => {
    const centerPointX = containerSize.width / 2;
    const centerPointY = containerSize.height / 2;
    const newScale = Math.max(0.25, viewport.scale * 0.83);
    const scaleRatio = newScale / viewport.scale;

    setViewport({
      x: centerPointX - (centerPointX - viewport.x) * scaleRatio,
      y: centerPointY - (centerPointY - viewport.y) * scaleRatio,
      scale: newScale
    });
  };

  const handleResetView = () => {
    setViewport({
      x: 100,
      y: 120,
      scale: 1
    });
  };

  const handleFitAll = () => {
    if (postIts.length === 0) {
      handleResetView();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    postIts.forEach(p => {
      const w = getPostItWidth(p.level);
      const h = 220;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + w);
      maxY = Math.max(maxY, p.y + h);
    });

    const padding = 120;
    const contentWidth = Math.max(100, maxX - minX + padding * 2);
    const contentHeight = Math.max(100, maxY - minY + padding * 2);

    const fitScaleX = containerSize.width / contentWidth;
    const fitScaleY = containerSize.height / contentHeight;
    const fitScale = Math.min(1.2, Math.max(0.3, Math.min(fitScaleX, fitScaleY)));

    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    const targetX = containerSize.width / 2 - contentCenterX * fitScale;
    const targetY = containerSize.height / 2 - contentCenterY * fitScale;

    setViewport({
      x: targetX,
      y: targetY,
      scale: fitScale
    });
  };

  // Touch Pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchInfoRef.current = {
        initialDistance: dist,
        initialScale: viewport.scale,
        initialMidX: midX,
        initialMidY: midY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchInfoRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleDelta = dist / touchInfoRef.current.initialDistance;
      const newScale = Math.min(2.5, Math.max(0.25, touchInfoRef.current.initialScale * scaleDelta));

      setViewport(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  };

  const handleTouchEnd = () => {
    touchInfoRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-screen overflow-hidden corkboard-canvas select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Wooden Frame Perimeter Shadow (Real Physical Pinboard Vignette) */}
      <div 
        className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] border-8 border-[#452711]/60" 
      />

      {/* Transformed Infinite World Layer */}
      <div
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform'
        }}
        className="absolute top-0 left-0 w-0 h-0"
      >
        {/* Dynamic Red Wool Yarn SVG Layer (behind notes) */}
        <YarnConnections postIts={displayPostIts} />

        {/* All Post-It Notes */}
        {displayPostIts.map((postIt) => {
          // Check search query highlight
          const matchesSearch = !searchQuery.trim() || 
            (postIt.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            postIt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            postIt.author.toLowerCase().includes(searchQuery.toLowerCase());

          return (
            <div 
              key={postIt.id} 
              className={`transition-opacity duration-200 ${matchesSearch ? 'opacity-100' : 'opacity-30'}`}
            >
              <PostItNode
                postIt={postIt}
                currentUserId={currentUserId}
                hasChildren={parentIdSet.has(postIt.id)}
                onDragStart={handlePostItDragStart}
                onReply={onReply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onVote={onVote}
                onReact={onReact}
                isDragging={draggedNoteId === postIt.id}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Zoom In/Out, Reset, Fit) */}
      <CanvasControls
        scale={viewport.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitAll={handleFitAll}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
      />

      {/* Minimap Radar */}
      {showMinimap && (
        <Minimap
          postIts={displayPostIts}
          viewport={viewport}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          onNavigate={(newX, newY) => setViewport(prev => ({ ...prev, x: newX, y: newY }))}
        />
      )}
    </div>
  );
};
