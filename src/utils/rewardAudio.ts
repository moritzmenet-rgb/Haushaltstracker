/**
 * Synthesized Web Audio Sound Engine for Gamified Rewards
 * Pure Web Audio API - Zero external assets, 100% reliable, zero latency.
 */

class RewardAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Harmonious major success chord when chore is completed & saved
   */
  playSuccessChord(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C5, E5, G5, C6 (Praise Chord)
    const frequencies = [523.25, 659.25, 783.99, 1046.50];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === frequencies.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      // Volume envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + 1.3);
    });
  }

  /**
   * Soft whoosh when coins explode into air
   */
  playWhoosh(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Crisp, metallic coin "Ding" as each coin lands in the progress bar.
   * Pitches up musically with consecutive hits (arpeggio feel).
   */
  playCoinDing(index: number = 0, total: number = 10): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Pentatonic scale frequency step for playful musical progression
    const pentatonicRatios = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5, 3];
    const ratio = pentatonicRatios[index % pentatonicRatios.length];
    const baseFreq = 987.77 * ratio; // B5 base

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    // Harmonic overtone for metallic sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.76, now);

    // Envelope
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    gain2.gain.setValueAtTime(0.06, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.3);
  }

  /**
   * Triumphant level-up fanfare when hitting or surpassing 100% weekly target
   */
  playLevelUpFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Rapid triumphal trumpet-style fanfare: G4 -> C5 -> E5 -> G5
    const notes = [
      { f: 392.00, t: 0.00, d: 0.12 },
      { f: 523.25, t: 0.12, d: 0.12 },
      { f: 659.25, t: 0.24, d: 0.14 },
      { f: 783.99, t: 0.38, d: 0.55 },
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.18, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });
  }

  /**
   * Epic, cinematic royal achievement fanfare with orchestral chords and celestial chimes
   */
  playEpicAchievementFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Grand Brass / Synth Fanfare Progression (C4 -> G4 -> C5 -> E5 -> G5 -> C6)
    const brassNotes = [
      { f: 261.63, t: 0.00, d: 0.16, v: 0.18 }, // C4
      { f: 392.00, t: 0.14, d: 0.16, v: 0.20 }, // G4
      { f: 523.25, t: 0.28, d: 0.18, v: 0.22 }, // C5
      { f: 659.25, t: 0.44, d: 0.22, v: 0.24 }, // E5
      { f: 783.99, t: 0.64, d: 0.26, v: 0.25 }, // G5
      { f: 1046.50, t: 0.88, d: 1.40, v: 0.28 }, // C6 (Grand Finale Hold)
    ];

    brassNotes.forEach(({ f, t, d, v }) => {
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      oscSub.type = 'sawtooth';

      osc.frequency.setValueAtTime(f, now + t);
      oscSub.frequency.setValueAtTime(f * 0.5, now + t); // Rich bottom octave

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(v, now + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now + t);
      filter.frequency.exponentialRampToValueAtTime(800, now + t + d);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now + t);
      oscSub.start(now + t);
      osc.stop(now + t + d + 0.1);
      oscSub.stop(now + t + d + 0.1);
    });

    // 2. Sparkling Celestial Chimes (Glissando arpeggios on top)
    const chimes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96];
    chimes.forEach((freq, idx) => {
      const chimeTime = now + 0.9 + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chimeTime);

      gain.gain.setValueAtTime(0, chimeTime);
      gain.gain.linearRampToValueAtTime(0.08, chimeTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, chimeTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chimeTime);
      osc.stop(chimeTime + 0.75);
    });
  }
}

export const rewardAudio = new RewardAudioEngine();
