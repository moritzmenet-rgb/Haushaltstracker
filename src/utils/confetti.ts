import confetti from 'canvas-confetti';

/**
 * Fires a joyful, celebratory confetti shower
 */
export function fireConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}) {
  try {
    const count = options?.particleCount || 60;
    const spread = options?.spread || 70;
    const origin = options?.origin || { x: 0.5, y: 0.6 };

    confetti({
      particleCount: count,
      spread,
      origin,
      colors: ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6'],
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      shapes: ['circle', 'square'],
      disableForReducedMotion: true
    });
  } catch (e) {
    console.warn('Confetti notice:', e);
  }
}

/**
 * Fires playful golden star confetti for major achievements
 */
export function fireStarConfetti() {
  try {
    confetti({
      particleCount: 45,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FFFFFF', '#6366F1'],
      ticks: 240,
      gravity: 0.9,
      scalar: 1.3,
      shapes: ['star'],
      disableForReducedMotion: true
    });
  } catch (e) {
    console.warn('Star confetti notice:', e);
  }
}

/**
 * Fires celebratory side cannons from left & right corners
 */
export function fireSideCannons() {
  try {
    const end = Date.now() + 800;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  } catch (e) {
    console.warn('Cannons notice:', e);
  }
}

/**
 * Fires a synchronized, multi-phase grand celebration for achievements
 */
export function fireEpicAchievementCelebration() {
  try {
    // 1. Instant golden ring explosion
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#F43F5E', '#8B5CF6'],
      ticks: 280,
      gravity: 0.8,
      scalar: 1.25,
      shapes: ['star', 'circle'],
      disableForReducedMotion: true
    });

    // 2. Delayed second wave of stars & side cannons
    setTimeout(() => {
      fireStarConfetti();
      fireSideCannons();
    }, 250);

    // 3. Third wave of floating shimmer
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 120,
        origin: { x: 0.5, y: 0.35 },
        colors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#FFFFFF'],
        ticks: 300,
        gravity: 0.6,
        scalar: 1.1,
        disableForReducedMotion: true
      });
    }, 550);
  } catch (e) {
    console.warn('Epic celebration error:', e);
  }
}

