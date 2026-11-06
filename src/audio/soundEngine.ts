// Procedural Web Audio Synthesizer for CHESS LEGENDS 3D
// Rich Medieval Fantasy Soundtrack + Battle SFX with auto-unlock on first user gesture

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private volume = 0.8;
  private musicInterval: number | null = null;
  private stepIndex = 0;
  private unlockBound = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindAutoUnlock();
    }
  }

  private bindAutoUnlock() {
    if (this.unlockBound) return;
    this.unlockBound = true;

    const unlock = () => {
      this.initContext();
      if (this.musicEnabled && !this.musicInterval) {
        this.startMusic();
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public configure(opts: { musicEnabled?: boolean; sfxEnabled?: boolean; volume?: number }) {
    if (opts.sfxEnabled !== undefined) this.sfxEnabled = opts.sfxEnabled;
    if (opts.volume !== undefined) this.volume = Math.max(0, Math.min(1, opts.volume));
    if (opts.musicEnabled !== undefined) {
      this.musicEnabled = opts.musicEnabled;
      if (this.musicEnabled) {
        this.startMusic();
      } else {
        this.stopMusic();
      }
    }
  }

  public startMusic() {
    if (!this.musicEnabled) return;
    this.initContext();
    if (this.musicInterval) return;

    // Epic Royal Fantasy Melody + Bass Drone Progression (A Minor / Dorian)
    const melody = [
      { lead: 440.0, bass: 110.0, fifth: 329.63 },   // A4
      { lead: 523.25, bass: 110.0, fifth: 329.63 },  // C5
      { lead: 659.25, bass: 110.0, fifth: 392.0 },   // E5
      { lead: 587.33, bass: 146.83, fifth: 440.0 },  // D5
      { lead: 523.25, bass: 146.83, fifth: 349.23 }, // C5
      { lead: 493.88, bass: 164.81, fifth: 329.63 }, // B4
      { lead: 440.0, bass: 110.0, fifth: 329.63 },   // A4
      { lead: 392.0, bass: 98.0, fifth: 293.66 },    // G4
      { lead: 440.0, bass: 130.81, fifth: 329.63 },  // A4
      { lead: 523.25, bass: 130.81, fifth: 392.0 },  // C5
      { lead: 587.33, bass: 146.83, fifth: 440.0 },  // D5
      { lead: 659.25, bass: 164.81, fifth: 493.88 }, // E5
      { lead: 783.99, bass: 130.81, fifth: 523.25 }, // G5
      { lead: 659.25, bass: 146.83, fifth: 440.0 },  // E5
      { lead: 587.33, bass: 98.0, fifth: 392.0 },    // D5
      { lead: 440.0, bass: 110.0, fifth: 329.63 },   // A4
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
        return;
      }
      if (this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const step = melody[this.stepIndex % melody.length];
      const isBarStart = this.stepIndex % 4 === 0;
      this.stepIndex++;

      // 1. Pluck Harp / Lute Lead Note
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(step.lead, now);

      const leadPeak = Math.max(0.001, 0.065 * this.volume);
      leadGain.gain.setValueAtTime(0.0001, now);
      leadGain.gain.exponentialRampToValueAtTime(leadPeak, now + 0.04);
      leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      leadOsc.connect(leadGain);
      leadGain.connect(this.ctx.destination);
      leadOsc.start(now);
      leadOsc.stop(now + 1.0);

      // 2. Warm Harmony Pad on every other beat
      if (this.stepIndex % 2 === 1) {
        const harmOsc = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(step.fifth, now);

        const harmPeak = Math.max(0.001, 0.04 * this.volume);
        harmGain.gain.setValueAtTime(0.0001, now);
        harmGain.gain.exponentialRampToValueAtTime(harmPeak, now + 0.12);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        harmOsc.connect(harmGain);
        harmGain.connect(this.ctx.destination);
        harmOsc.start(now);
        harmOsc.stop(now + 1.25);
      }

      // 3. Deep Royal Cello / Bass Drone on bar start
      if (isBarStart) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(step.bass, now);

        const bassPeak = Math.max(0.001, 0.08 * this.volume);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(bassPeak, now + 0.15);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 2.15);
      }
    }, 520);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);

    gain.gain.setValueAtTime(Math.max(0.001, 0.12 * this.volume), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playSelect() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.09);

    gain.gain.setValueAtTime(Math.max(0.001, 0.14 * this.volume), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playFootsteps(steps = 3) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    for (let i = 0; i < steps; i++) {
      const delay = i * 0.11;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 + (i % 2) * 25, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

      gain.gain.setValueAtTime(Math.max(0.001, 0.15 * this.volume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  public playSwordClash() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1180, 1760, 2480];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 0.28);

      gain.gain.setValueAtTime(Math.max(0.001, (0.12 / (idx + 1)) * this.volume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });

    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(130, now + 0.08);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.32);
    thudGain.gain.setValueAtTime(Math.max(0.001, 0.28 * this.volume), now + 0.08);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thud.start(now + 0.08);
    thud.stop(now + 0.35);
  }

  public playCheck() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(Math.max(0.001, 0.12 * this.volume), now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    });
  }

  public playVictory() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, t: 0, d: 0.18 },
      { f: 659.25, t: 0.18, d: 0.18 },
      { f: 783.99, t: 0.36, d: 0.18 },
      { f: 1046.5, t: 0.54, d: 0.55 },
    ];
    fanfare.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(Math.max(0.001, 0.2 * this.volume), now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }

  public playDefeat() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 392.0, t: 0, d: 0.25 },
      { f: 349.23, t: 0.25, d: 0.25 },
      { f: 311.13, t: 0.5, d: 0.25 },
      { f: 261.63, t: 0.75, d: 0.6 },
    ];
    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(Math.max(0.001, 0.14 * this.volume), now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }
}

export const soundEngine = new SoundEngine();
