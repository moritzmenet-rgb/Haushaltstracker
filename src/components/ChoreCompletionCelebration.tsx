import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Star, Sparkles, Trophy, Award } from 'lucide-react';
import { rewardAudio } from '../utils/rewardAudio';
import { RewardCelebration } from '../types';

interface ChoreCompletionCelebrationProps {
  celebration: RewardCelebration | null;
  onComplete: () => void;
}

interface FlyingCoin {
  id: number;
  initialOffsetX: number;
  initialOffsetY: number;
  initialScale: number;
  initialRotation: number;
}

export const ChoreCompletionCelebration: React.FC<ChoreCompletionCelebrationProps> = ({
  celebration,
  onComplete
}) => {
  // Animation phases:
  // 'idle' -> 'crest' (0-1.2s) -> 'morph' (1.2-2.0s) -> 'flying' (2.0-3.3s) -> 'climax' (3.3-3.8s) -> 'done'
  const [phase, setPhase] = useState<'idle' | 'crest' | 'morph' | 'flying' | 'climax'>('idle');
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [coinsLanded, setCoinsLanded] = useState(0);

  // Generate coin particle data when celebration starts
  const coinCount = Math.min(14, Math.max(7, Math.round((celebration?.points || 10) / 4)));
  const coinsRef = useRef<FlyingCoin[]>([]);

  useEffect(() => {
    if (!celebration) {
      setPhase('idle');
      setCoinsLanded(0);
      return;
    }

    // Generate random burst offsets for coins
    coinsRef.current = Array.from({ length: coinCount }, (_, i) => {
      const angle = (i / coinCount) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 50 + Math.random() * 80;
      return {
        id: i,
        initialOffsetX: Math.cos(angle) * dist,
        initialOffsetY: Math.sin(angle) * dist,
        initialScale: 0.85 + Math.random() * 0.35,
        initialRotation: Math.random() * 360
      };
    });

    // Locate the weekly progress bar in the DOM
    const updateTargetCoords = () => {
      const barEl = document.getElementById('weekly-progress-bar');
      if (barEl) {
        const rect = barEl.getBoundingClientRect();
        setTargetCoords({
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5
        });
      } else {
        // Fallback target: upper third of screen
        setTargetCoords({
          x: window.innerWidth / 2,
          y: Math.min(220, window.innerHeight * 0.28)
        });
      }
    };
    updateTargetCoords();

    // Start Phase 1: Triumph Crest
    setPhase('crest');
    setCoinsLanded(0);
    rewardAudio.playSuccessChord();

    // Phase 2: Morph to Coins at 1.1s
    const timer1 = setTimeout(() => {
      setPhase('morph');
      rewardAudio.playWhoosh();
      updateTargetCoords();
    }, 1100);

    // Phase 3: Launch Coins at 1.8s
    const timer2 = setTimeout(() => {
      setPhase('flying');
      updateTargetCoords();
    }, 1800);

    // Phase 4: Climax at 3.3s
    const timer3 = setTimeout(() => {
      setPhase('climax');
      const reachedTarget =
        celebration.previousCyclePoints + celebration.points >= celebration.targetPoints;
      if (reachedTarget) {
        rewardAudio.playLevelUpFanfare();
      }
    }, 3300);

    // End Celebration at 3.8s + 250ms delay
    const timer4 = setTimeout(() => {
      setPhase('idle');
      // Wait another 250ms as requested before finally calling onComplete
      setTimeout(() => {
        onComplete();
      }, 250);
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [celebration, coinCount, onComplete]);

  if (!celebration || phase === 'idle') return null;

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;

  const handleCoinLanded = (index: number) => {
    rewardAudio.playCoinDing(index, coinCount);
    setCoinsLanded((prev) => {
      const next = prev + 1;
      // Dispatch custom event so the progress bar can pulse & increment in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('coin-hit-progress-bar', {
            detail: {
              coinIndex: next,
              totalCoins: coinCount,
              pointsEarned: celebration.points,
              previousCyclePoints: celebration.previousCyclePoints,
              targetPoints: celebration.targetPoints
            }
          })
        );
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Dynamic ambient backdrop illumination */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'crest' || phase === 'morph' ? 0.6 : 0.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      {/* Radial golden glow in center during crest/morph */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: phase === 'crest' || phase === 'morph' ? [1, 1.2, 1] : 0,
          opacity: phase === 'crest' || phase === 'morph' ? 0.8 : 0
        }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/30 to-indigo-500/20 blur-[80px]"
      />

      {/* ===================== PHASE 1: TRIUMPHANT SUCCESS CREST ===================== */}
      <AnimatePresence>
        {phase === 'crest' && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, filter: 'blur(8px)', transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm pointer-events-auto"
          >
            {/* Rotating sunburst aura */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-12 w-48 h-48 rounded-full bg-gradient-to-tr from-yellow-300/30 to-amber-500/10 blur-xl -z-10"
            />

            {/* Glowing 3D Emblem with Star/Trophy */}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-[3px] shadow-[0_12px_40px_rgba(245,158,11,0.5)] mb-4 relative"
            >
              <div className="w-full h-full rounded-[21px] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent" />
                <Check className="w-10 h-10 text-amber-300 stroke-[3.5] drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]" />
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: celebration.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-300 drop-shadow-sm" />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Header Titles */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider mb-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Erfolgreich gesichert ✓</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                {celebration.taskTitle}
              </h2>
            </motion.div>

            {/* Large Points Award Pill */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.25 }}
              className="mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xl shadow-[0_8px_25px_rgba(245,158,11,0.5)] flex items-center gap-2"
            >
              <span className="text-2xl">🪙</span>
              <span>+{celebration.points} Münzen</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== PHASE 2 & 3: FLYING GOLDEN 3D COINS ===================== */}
      {(phase === 'morph' || phase === 'flying' || phase === 'climax') && (
        <div className="absolute inset-0 pointer-events-none">
          {coinsRef.current.map((coin, index) => {
            const startX = centerX + coin.initialOffsetX;
            const startY = centerY + coin.initialOffsetY;
            const delay = (index / coinCount) * 0.35; // Staggered flight takeoff

            return (
              <motion.div
                key={coin.id}
                initial={{
                  x: centerX,
                  y: centerY,
                  scale: 0,
                  opacity: 0,
                  rotate: coin.initialRotation
                }}
                animate={
                  phase === 'morph'
                    ? {
                        // Hover in cluster in center
                        x: startX,
                        y: startY,
                        scale: coin.initialScale,
                        opacity: 1,
                        rotate: coin.initialRotation + 30
                      }
                    : {
                        // Launch to weekly progress bar target
                        x: [startX, startX + (targetCoords.x - startX) * 0.4 + (index % 2 === 0 ? 60 : -60), targetCoords.x],
                        y: [startY, Math.min(startY, targetCoords.y) - 80, targetCoords.y],
                        scale: [coin.initialScale, coin.initialScale * 1.25, 0.4],
                        opacity: [1, 1, 0],
                        rotate: coin.initialRotation + 720
                      }
                }
                transition={
                  phase === 'morph'
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 18,
                        delay: index * 0.02
                      }
                    : {
                        duration: 0.65,
                        delay: delay,
                        ease: [0.25, 0.1, 0.25, 1]
                      }
                }
                onAnimationComplete={() => {
                  if (phase === 'flying') {
                    handleCoinLanded(index);
                  }
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
                className="w-10 h-10 -ml-5 -mt-5 flex items-center justify-center pointer-events-none z-50"
              >
                {/* 3D Shiny Metallic Coin Mesh */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-yellow-200 shadow-[0_4px_16px_rgba(245,158,11,0.6)] flex items-center justify-center relative overflow-hidden">
                  {/* Embossed inner ring */}
                  <div className="w-7 h-7 rounded-full border border-amber-600/60 bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-amber-950 font-black text-xs shadow-inner">
                    🪙
                  </div>
                  {/* Radial shine light glint */}
                  <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-white/50 blur-[2px]" />
                </div>
              </motion.div>
            );
          })}

          {/* Floating Impact Shockwaves at the Progress Bar Destination */}
          {targetCoords.x > 0 && coinsLanded > 0 && (
            <motion.div
              key={coinsLanded}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${targetCoords.x}px`,
                top: `${targetCoords.y}px`
              }}
              className="w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-amber-300 bg-amber-400/25 pointer-events-none z-40"
            />
          )}

          {/* Quick HUD indicator over the progress bar while filling */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase === 'flying' || phase === 'climax' ? 1 : 0, y: 0 }}
            style={{
              position: 'absolute',
              left: `${targetCoords.x}px`,
              top: `${targetCoords.y - 48}px`
            }}
            className="-translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-black text-xs shadow-lg flex items-center gap-1.5 pointer-events-none z-50 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>+{celebration.points} Punkte gutgeschrieben!</span>
          </motion.div>
        </div>
      )}
    </div>
  );
};
