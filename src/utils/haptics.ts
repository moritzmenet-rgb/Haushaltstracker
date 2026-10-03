/**
 * JARVIS Tactical Haptics Engine
 * Provides multi-tier tactile vibration feedback for mobile web & PWA devices.
 */

class HapticsEngine {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jarvis_haptics_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  public isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  public setEnabled(enable: boolean): void {
    this.enabled = enable;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('jarvis_haptics_enabled', enable ? 'true' : 'false');
    }
  }

  private trigger(pattern: number | number[]): void {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors silently
    }
  }

  /**
   * Ultra-light tap feedback for general button clicks and chips
   */
  public light(): void {
    this.trigger(10);
  }

  /**
   * Selection tick for toggles, tabs, filter chips
   */
  public selection(): void {
    this.trigger(8);
  }

  /**
   * Medium punch for opening modals, pinning tasks, primary clicks
   */
  public medium(): void {
    this.trigger(22);
  }

  /**
   * Strong haptic for delete confirmation, warning prompts
   */
  public heavy(): void {
    this.trigger(38);
  }

  /**
   * Playful success sequence when logging chore or earning points
   */
  public success(): void {
    this.trigger([14, 40, 26]);
  }

  /**
   * Grand celebratory cadence for level-up or target hit
   */
  public celebration(): void {
    this.trigger([20, 45, 30, 50, 70]);
  }

  /**
   * Epic crescendo sequence for major achievement unlock
   */
  public achievement(): void {
    // 5-beat sync rhythm matching fanfare
    this.trigger([30, 50, 45, 60, 60, 80, 110]);
  }

  /**
   * Error or blocked action pattern
   */
  public error(): void {
    this.trigger([40, 60, 40]);
  }
}

export const haptic = new HapticsEngine();
