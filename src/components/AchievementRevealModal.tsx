import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Check } from 'lucide-react';
import { AchievementDef } from '../data/achievementsData';
import { rewardAudio } from '../utils/rewardAudio';
import { fireStarConfetti, fireSideCannons } from '../utils/confetti';

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
  // Trigger sound and confetti when badge appears
  useEffect(() => {
    if (badge) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        rewardAudio.playSuccessChord();
        fireStarConfetti();
        fireSideCannons();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  return (
    <AnimatePresence>
      {badge && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          {/* Ambient Glow Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-transparent to-amber-500/20 pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 15,
              mass: 1.2
            }}
            className="relative bg-[var(--m3-surface-container-high)] border-2 border-white/20 rounded-[36px] sm:rounded-[48px] p-6 sm:p-8 max-w-sm w-full max-h-[92vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.6)] text-center"
          >
            {/* Animated Glow behind the badge */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/30 blur-3xl rounded-full -z-10"
            />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--m3-surface-container-highest)] hover:bg-[var(--m3-on-surface)]/10 text-[var(--m3-on-surface-variant)] flex items-center justify-center transition cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              {/* Playful Label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-500 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-6"
              >
                <Trophy className="w-4 h-4" />
                <span>Abzeichen Freigeschaltet!</span>
              </motion.div>

              {/* The Badge itself with Floating Animation (Clay-Style) */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="relative mb-8"
              >
                <div className="w-40 h-40 rounded-[40px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-[4px] shadow-[0_20px_50px_rgba(245,158,11,0.5)]">
                  <div className="w-full h-full rounded-[36px] bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-transparent" />
                    <span className="text-7xl drop-shadow-[0_4px_15px_rgba(251,191,36,0.8)] select-none">
                      {badge.emoji}
                    </span>
                  </div>
                </div>
                
                {/* Particle Sparkles around badge */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 -m-4 pointer-events-none"
                >
                  {[...Array(6)].map((_, i) => (
                    <Sparkles 
                      key={i} 
                      className="absolute w-5 h-5 text-yellow-300 opacity-60"
                      style={{ 
                        top: `${50 + 60 * Math.sin((i * 60 * Math.PI) / 180)}%`,
                        left: `${50 + 60 * Math.cos((i * 60 * Math.PI) / 180)}%`
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Achievement Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-3xl font-black text-[var(--m3-on-surface)] tracking-tight mb-3">
                  {badge.title}
                </h2>
                <p className="text-base font-medium text-[var(--m3-on-surface-variant)] mb-10 leading-relaxed px-2">
                  {badge.description}
                </p>
              </motion.div>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full relative z-10">
                {onSetAsActiveBadge && (
                  <button
                    onClick={() => {
                      onSetAsActiveBadge(badge.id);
                      onClose();
                    }}
                    className="w-full py-4 rounded-3xl bg-[var(--m3-primary)] text-[var(--m3-on-primary)] font-black text-sm shadow-lg shadow-[var(--m3-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Als Titel setzen</span>
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-3xl bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] font-bold text-sm hover:bg-[var(--m3-on-surface)]/10 transition-all cursor-pointer"
                >
                  Großartig! 🎉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
