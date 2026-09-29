import React from 'react';
import { motion } from 'motion/react';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';

interface UserBadgeProps {
  badgeId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTitle?: boolean;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  badgeId,
  size = 'sm',
  className = '',
  showTitle = false
}) => {
  if (!badgeId) return null;
  const badge = ACHIEVEMENTS_DATA.find(b => b.id === badgeId);
  if (!badge) return null;

  const isTrophy = badgeId.startsWith('trophy_');

  const sizeClasses = {
    xs: 'text-xs leading-none',
    sm: 'text-sm leading-none',
    md: 'text-base leading-none',
    lg: 'text-xl leading-none'
  };

  return (
    <motion.span
      initial={isTrophy ? { y: 0, scale: 1 } : false}
      animate={isTrophy ? { 
        y: [0, -2, 0],
        scale: [1, 1.1, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(245,158,11,0))',
          'drop-shadow(0 0 4px rgba(245,158,11,0.4))',
          'drop-shadow(0 0 0px rgba(245,158,11,0))'
        ]
      } : false}
      transition={isTrophy ? { 
        duration: 2.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      } : undefined}
      className={`inline-flex items-center gap-1 select-none cursor-default transition-all duration-300 hover:scale-135 active:scale-95 ${className} ${isTrophy ? 'z-10' : ''}`}
      title={`Titel: ${badge.title} – ${badge.description}`}
      aria-label={`Abzeichen: ${badge.title}`}
    >
      <span className={sizeClasses[size]}>{badge.emoji}</span>
      {showTitle && (
        <span className="text-[10px] font-black text-[var(--m3-primary)] truncate max-w-[120px]">
          {badge.title}
        </span>
      )}
    </motion.span>
  );
};
