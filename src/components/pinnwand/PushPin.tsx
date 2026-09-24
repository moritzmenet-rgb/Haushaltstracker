import React from 'react';
import type { PinColor } from '../../types/pinnwand';

interface PushPinProps {
  color?: PinColor;
  className?: string;
  hasYarn?: boolean;
}

export const PushPin: React.FC<PushPinProps> = ({ 
  color = 'red', 
  className = '',
  hasYarn = false
}) => {
  // Color presets for realistic pushpin heads
  const pinThemes = {
    red: {
      gradientStart: '#ef4444',
      gradientEnd: '#991b1b',
      highlight: '#fca5a5',
      rim: '#7f1d1d'
    },
    wood: {
      gradientStart: '#d97706',
      gradientEnd: '#78350f',
      highlight: '#fde68a',
      rim: '#451a03'
    },
    gold: {
      gradientStart: '#fbbf24',
      gradientEnd: '#b45309',
      highlight: '#fef08a',
      rim: '#78350f'
    },
    blue: {
      gradientStart: '#3b82f6',
      gradientEnd: '#1e3a8a',
      highlight: '#93c5fd',
      rim: '#172554'
    },
    black: {
      gradientStart: '#4b5563',
      gradientEnd: '#111827',
      highlight: '#9ca3af',
      rim: '#030712'
    }
  };

  const theme = pinThemes[color] || pinThemes.red;
  const gradId = `pin-grad-${color}`;

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Pushpin shadow cast onto the cork & paper */}
      <div 
        className="absolute w-4 h-4 rounded-full bg-black/35 blur-[1.5px] transform translate-x-1.5 translate-y-2 pointer-events-none" 
      />

      {/* Tiny red yarn loop knot around the pin if connected */}
      {hasYarn && (
        <div className="absolute w-6 h-6 rounded-full border-2 border-red-600/90 shadow-xs transform scale-110 pointer-events-none -translate-y-0.5" />
      )}

      {/* 3D Pushpin Head SVG */}
      <svg 
        width="22" 
        height="22" 
        viewBox="0 0 24 24" 
        className="relative z-10 drop-shadow-sm"
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={theme.highlight} />
            <stop offset="40%" stopColor={theme.gradientStart} />
            <stop offset="90%" stopColor={theme.gradientEnd} />
            <stop offset="100%" stopColor={theme.rim} />
          </radialGradient>
        </defs>

        {/* Outer rim */}
        <circle cx="12" cy="12" r="10" fill={theme.rim} />
        {/* Main bulb */}
        <circle cx="12" cy="12" r="8.5" fill={`url(#${gradId})`} />
        {/* Center metallic dimple / highlight */}
        <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.6)" />
        <circle cx="9.5" cy="9.5" r="1.2" fill="#ffffff" />
      </svg>
    </div>
  );
};
