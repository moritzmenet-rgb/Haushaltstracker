import React from 'react';
import { ACHIEVEMENTS_DATA, AchievementDef } from '../data/achievementsData';

interface UserBadgeTagProps {
  badgeId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  className?: string;
}

export const UserBadgeTag: React.FC<UserBadgeTagProps> = ({
  badgeId,
  size = 'sm',
  showTitle = false,
  className = ''
}) => {
  if (!badgeId || typeof badgeId !== 'string' || !badgeId.trim()) return null;

  const badge: AchievementDef | undefined = ACHIEVEMENTS_DATA.find(b => b.id === badgeId);
  if (!badge) return null;

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 rounded-lg gap-1',
    sm: 'text-xs px-2 py-0.5 rounded-lg gap-1.5',
    md: 'text-sm px-2.5 py-1 rounded-xl gap-2',
    lg: 'text-base px-3 py-1.5 rounded-2xl gap-2.5'
  }[size];

  const emojiSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[size];

  return (
    <span
      className={`inline-flex items-center bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black shrink-0 transition-transform hover:scale-105 select-none ${sizeClasses} ${className}`}
      title={`${badge.title}: ${badge.description}`}
      aria-label={`Titel-Abzeichen: ${badge.title}`}
    >
      <span className={`${emojiSizes} drop-shadow-xs`}>{badge.emoji}</span>
      {showTitle && (
        <span className="text-[11px] font-extrabold tracking-tight truncate max-w-[120px]">
          {badge.title}
        </span>
      )}
    </span>
  );
};
