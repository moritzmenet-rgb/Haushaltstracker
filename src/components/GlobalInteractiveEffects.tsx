import React, { useEffect, useCallback } from 'react';
import { haptic } from '../utils/haptics';

export const GlobalInteractiveEffects: React.FC = () => {
  const handlePointerDown = useCallback((e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const interactiveElement = target.closest('button, a, input, select, textarea, [role="button"], [role="tab"], .interactive-click');
    const isCard = target.closest('.task-card, .glass-card, .clickable-card');

    // Tactile vibration without visual click overlays / particles
    if (interactiveElement || isCard) {
      if (interactiveElement?.getAttribute('data-haptic') === 'heavy') {
        haptic.heavy();
      } else if (interactiveElement?.getAttribute('data-haptic') === 'medium') {
        haptic.medium();
      } else {
        haptic.light();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [handlePointerDown]);

  // Zero DOM clutter, no visual click animations or confetti
  return null;
};
