import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Check, Star } from 'lucide-react';
import { AchievementDef } from '../data/achievementsData';
import { rewardAudio } from '../utils/rewardAudio';
import { fireEpicAchievementCelebration } from '../utils/confetti';
import { haptic } from '../utils/haptics';

interface AchievementRevealModalProps {
  badge: AchievementDef | null;
  onClose: () => void;
  onSetAsActiveBadge?: (badgeId: string) => void;
}

export const AchievementRevealModal: React.FC<AchievementRevealModalProps> = ({
  badge,
  onClose,
  onSetAsActiveBadge
}) => {
  // Trigger sound, vibration and confetti when badge appears
  useEffect(() => {
    if (badge) {
      haptic.achievement();
      const timer = setTimeout(() => {
        rewardAudio.playEpicAchievementFanfare();
        fireEpicAchievementCelebration();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  return (
    <AnimatePresence>
      {badge && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-hidden">
          {/* Ambient Glow & Radial Vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/25 via-indigo-900/20 to-black pointer-events-none"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ 
              type: 'spring', 
              stiffness: 350, 
              damping: 20,
              mass: 1.1
            }}
            className="relative bg-[var(--m3-surface-container-high)] border-2 border-amber-400/40 rounded-[38px] sm:rounded-[52px] p-6 sm:p-10 max-w-sm w-full max-h-[92vh] overflow-y-auto shadow-[0_32px_100px_rgba(245,158,11,0.35)] text-center"
          >
            {/* 1. Epic Rotating Sunburst / God Rays behind the badge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 pointer-events-none -z-10 opacity-70"
            >
              <div className="w-full h-full bg-[conic-gradient(from_0deg,_rgba(245,158,11,0.35)_0deg,_transparent_30deg,_rgba(251,191,36,0.4)_60deg,_transparent_90deg,_rgba(245,158,11,0.35)_120deg,_transparent_150deg,_rgba(251,191,36,0.4)_180deg,_transparent_210deg,_rgba(245,158,11,0.35)_240deg,_transparent_270deg,_rgba(251,191,36,0.4)_300deg,_transparent_330deg,_rgba(245,158,11,0.35)_360deg)] rounded-full blur-md" />
            </motion.div>

            {/* 2. Expanding Holographic Shockwave Ring */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: [0.2, 1.8, 2.4], opacity: [0.9, 0.4, 0] }}
              transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.5 }}
              className="absolute top-28 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border-2 border-amber-300/80 pointer-events-none -z-10"
            />

            {/* Close Button */}
            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--m3-surface-container-highest)] hover:bg-[var(--m3-on-surface)]/10 text-[var(--m3-on-surface-variant)] flex items-center justify-center transition-all cursor-pointer z-20 active:scale-90"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              {/* Playful Pill Label with Golden Starbursts */}
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/30 to-amber-500/25 border border-amber-400/50 text-amber-500 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-6 shadow-sm"
              >
                <Trophy className="w-4 h-4 animate-bounce" />
                <span>Legende Freigeschaltet!</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </motion.div>

              {/* The Badge itself with Floating 3D Elastic Physics */}
              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ 
                  scale: [0, 1.25, 0.95, 1.05, 1],
                  rotate: [ -25, 10, -5, 0 ],
                  y: [0, -12, 0]
                }}
                transition={{ 
                  scale: { duration: 0.8, ease: 'easeOut' },
                  rotate: { duration: 0.8, ease: 'easeOut' },
                  y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
                }}
                className="relative mb-7 group cursor-pointer"
                onClick={() => {
                  haptic.medium();
                  rewardAudio.playCoinDing(5);
                }}
              >
                {/* Golden Outer Shell with Shiny Rim */}
                <div className="w-44 h-44 rounded-[44px] bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-100 p-[5px] shadow-[0_25px_60px_rgba(245,158,11,0.6)] relative overflow-hidden">
                  
                  {/* Sheen sweeping light reflection */}
                  <motion.div
                    animate={{ x: ['-140%', '160%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none z-10"
                  />

                  {/* Inner Dark Jewel Capsule */}
                  <div className="w-full h-full rounded-[38px] bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/25 via-transparent to-amber-950/40" />
                    
                    {/* Big Emoji with Glow */}
                    <span className="text-8xl drop-shadow-[0_8px_24px_rgba(251,191,36,0.9)] select-none transform hover:scale-110 active:scale-95 transition-transform duration-200">
                      {badge.emoji}
                    </span>
                  </div>
                </div>
                
                {/* Orbiting Sparkles around Badge */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-5 pointer-events-none"
                >
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <Sparkles 
                      key={i} 
                      className="absolute w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] opacity-80"
                      style={{ 
                        top: `${50 + 58 * Math.sin((deg * Math.PI) / 180)}%`,
                        left: `${50 + 58 * Math.cos((deg * Math.PI) / 180)}%`
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Achievement Info */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
              >
                <h2 className="text-3xl font-black text-[var(--m3-on-surface)] tracking-tight mb-2 flex items-center justify-center gap-2">
                  <span>{badge.title}</span>
                </h2>
                <p className="text-sm sm:text-base font-medium text-[var(--m3-on-surface-variant)] mb-8 leading-relaxed px-2">
                  {badge.description}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full relative z-10">
                {onSetAsActiveBadge && (
                  <button
                    onClick={() => {
                      haptic.success();
                      rewardAudio.playSuccessChord();
                      onSetAsActiveBadge(badge.id);
                      onClose();
                    }}
                    className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 font-black text-sm shadow-[0_10px_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Als aktiven Titel ausrüsten</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    haptic.light();
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-3xl bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] font-bold text-sm hover:bg-[var(--m3-on-surface)]/10 active:scale-95 transition-all cursor-pointer"
                >
                  Weiter so! 🎉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
