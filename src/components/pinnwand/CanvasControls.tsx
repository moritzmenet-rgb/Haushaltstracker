import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Map as MapIcon 
} from 'lucide-react';

interface CanvasControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitAll: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitAll,
  showMinimap,
  onToggleMinimap
}) => {
  const percentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 dark:border-white/10 select-none">
      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
        title="Herauszoomen (-)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Percentage Display */}
      <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 px-2 min-w-12 text-center">
        {percentage}%
      </span>

      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
        title="Heranzoomen (+)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

      {/* Reset View */}
      <button
        type="button"
        onClick={onResetView}
        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        title="Ansicht zurücksetzen (1:1)"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Reset</span>
      </button>

      {/* Fit All Content */}
      <button
        type="button"
        onClick={onFitAll}
        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        title="Alle Notizen ins Bild einpassen"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="hidden sm:inline">Alles zeigen</span>
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

      {/* Minimap Toggle */}
      <button
        type="button"
        onClick={onToggleMinimap}
        className={`p-2 rounded-xl transition cursor-pointer ${
          showMinimap 
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
            : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200'
        }`}
        title="Minimap ein-/ausblenden"
      >
        <MapIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
