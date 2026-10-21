export type SoundProfile = 'tactile' | 'thock' | 'minimal';

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playKey(enabled: boolean, profile: SoundProfile = 'tactile'): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (profile === 'tactile') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(195, now);
        osc.frequency.exponentialRampToValueAtTime(68, now + 0.022);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);
      } else if (profile === 'thock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.03);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.015);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore audio errors on restricted browsers
    }
  }

  playError(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.038);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.042);
    } catch {
      // Ignore audio errors
    }
  }

  playComplete(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25]; // C5 -> E5 subtle chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.05, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.17);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const soundEngine = new SoundEngine();
