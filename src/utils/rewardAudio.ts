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

  /**
   * Ultra-cute, expressive Anime Kitten "Nyaa~" with vocal formant filter
   */
  playCatMeow(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual harmonized vocal cords (Fundamental + First Formant Harmonic)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const formantFilter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Pitch contour for high-pitched cute anime kitten mew:
    // Starts at 620Hz, swoops playfully up to 960Hz, then gently relaxes to 640Hz
    osc1.frequency.setValueAtTime(620, now);
    osc1.frequency.exponentialRampToValueAtTime(960, now + 0.14);
    osc1.frequency.exponentialRampToValueAtTime(640, now + 0.42);

    osc2.frequency.setValueAtTime(1240, now);
    osc2.frequency.exponentialRampToValueAtTime(1920, now + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(1280, now + 0.42);

    // Formant vocal tract resonance (simulates 'Nyaaa' mouth opening)
    formantFilter.type = 'bandpass';
    formantFilter.Q.setValueAtTime(3.8, now);
    formantFilter.frequency.setValueAtTime(1100, now);
    formantFilter.frequency.linearRampToValueAtTime(2200, now + 0.16);
    formantFilter.frequency.exponentialRampToValueAtTime(950, now + 0.44);

    // Dynamic volume envelope
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.09, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    masterGain.gain.setValueAtTime(0.9, now);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(formantFilter);
    gain2.connect(formantFilter);
    formantFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  }

  /**
   * Joyful Kitten Chirp / Purr-Meow on pet ("Brrr-mew!")
   */
  playCatChirp(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast arpeggiated trill
    [587.33, 739.99, 880.00, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, time + 0.08);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.18);
    });
  }

  /**
   * Deep, velvety, rhythmic purr with realistic feline vibration
   */
  playCatPurr(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const oscSub = ctx.createOscillator();
    const oscBody = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(42, now);

    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(84, now);

    // Purr rhythm tremor (24Hz)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now);

    lfoGain.gain.setValueAtTime(0.6, now);
    lfo.connect(lfoGain);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);

    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.16, now + 0.12);
    mainGain.gain.setValueAtTime(0.16, now + 0.7);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    oscSub.connect(filter);
    oscBody.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);

    lfo.start(now);
    oscSub.start(now);
    oscBody.start(now);

    lfo.stop(now + 1.15);
    oscSub.stop(now + 1.15);
    oscBody.stop(now + 1.15);
  }

  /**
   * Crunchy treat chewing sound with playful sparkles
   */
  playCatCrunch(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Crisp biting clicks
    [0, 0.08, 0.16, 0.24].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480 - idx * 60, now + offset);
      osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.05);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now + offset);
      filter.Q.setValueAtTime(2, now + offset);

      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });

    // 2. Soft pleasant bell chime at end (Happy eating)
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1318.51, now + 0.28); // E6
    bellGain.gain.setValueAtTime(0.08, now + 0.28);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now + 0.28);
    bellOsc.stop(now + 0.72);
  }

  /**
   * Sparkly soap bubbles and splashing sound
   */
  playCatSplash(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Multiple gentle water bubble pops (increasing pitch glissandi)
    [0, 0.06, 0.12, 0.19, 0.27].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startF = 350 + idx * 180;
      const endF = 850 + idx * 220;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startF, now + offset);
      osc.frequency.exponentialRampToValueAtTime(endF, now + offset + 0.07);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  }
}

export const rewardAudio = new RewardAudioEngine();
