// Web Audio API Synthesizer - Zero external audio file dependencies
class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private currentBassStep: number = 0;
  private currentChordIndex: number = 0;
  
  private sfxVol: number = 0.7;
  private musicVol: number = 0.4;
  private masterVol: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.musicVol = music;

    if (this.ctx && this.masterGain && this.sfxGain && this.musicGain) {
      this.masterGain.gain.setValueAtTime(master, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    }
  }

  // --- SOUND EFFECTS ---

  public playLaser(type: 'PULSE' | 'CHAIN' | 'TORPEDO' | 'BLADE' | 'CRYO' = 'PULSE') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    if (type === 'PULSE') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.13);
    } else if (type === 'CHAIN') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(300, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.09);
    } else if (type === 'TORPEDO') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.21);
    } else if (type === 'BLADE') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(150, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.16);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  }

  public playHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playCritHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.14);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playExplosion(isLarge = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const dur = isLarge ? 0.45 : 0.25;

    // Noise buffer for punchy impact explosion
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 400 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(30, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isLarge ? 120 : 90, t);
    subOsc.frequency.exponentialRampToValueAtTime(20, t + dur);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(isLarge ? 0.5 : 0.25, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    whiteNoise.start(t);
    subOsc.start(t);
    whiteNoise.stop(t + dur);
    subOsc.stop(t + dur);
  }

  public playDash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playGemCollect(combo = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale based on combo
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const pitch = pentatonic[Math.min(combo - 1, pentatonic.length - 1)] || 659.25;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.09);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playPowerup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + i * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.1);
    });
  }

  public playLevelUp() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const chord = [392, 493.88, 587.33, 783.99, 987.77];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.06;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.2, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.42);
    });
  }

  public playBossAlarm() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteT = t + i * 0.28;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, noteT);
      osc.frequency.linearRampToValueAtTime(440, noteT + 0.14);
      osc.frequency.linearRampToValueAtTime(220, noteT + 0.25);

      gain.gain.setValueAtTime(0.3, noteT);
      gain.gain.linearRampToValueAtTime(0.01, noteT + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteT);
      osc.stop(noteT + 0.26);
    }
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 369.99, 329.63, 220];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteT = t + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteT);

      gain.gain.setValueAtTime(0.25, noteT);
      gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteT);
      osc.stop(noteT + 0.36);
    });
  }

  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteT = t + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteT);

      gain.gain.setValueAtTime(0.3, noteT);
      gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteT);
      osc.stop(noteT + 0.52);
    });
  }

  // --- PROCEDURAL RETROWAVE SYNTH BACKGROUND MUSIC ---

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;

    // Chords: Am -> F -> C -> G (Cyberpunk mood)
    const chords = [
      { bass: 110, lead: [220, 261.63, 329.63, 440] }, // Am
      { bass: 87.31, lead: [174.61, 220, 261.63, 349.23] }, // F
      { bass: 130.81, lead: [261.63, 329.63, 392, 523.25] }, // C
      { bass: 98, lead: [196, 246.94, 293.66, 392] }, // G
    ];

    const bpm = 128;
    const stepTimeMs = (60 / bpm / 4) * 1000; // 16th note in ms (~117ms)

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.musicVol <= 0.01) return;

      const chord = chords[this.currentChordIndex];
      const t = this.ctx.currentTime;

      // 1. Driving Bass pulse (every 8th note)
      if (this.currentBassStep % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(chord.bass / 2, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.12);

        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.15);
      }

      // 2. Arpeggiated synth lead
      const noteIdx = this.currentBassStep % chord.lead.length;
      const leadFreq = chord.lead[noteIdx];
      
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, t);

      leadGain.gain.setValueAtTime(0.08, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(t);
      leadOsc.stop(t + 0.11);

      // Step counter
      this.currentBassStep++;
      if (this.currentBassStep >= 16) {
        this.currentBassStep = 0;
        this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
      }
    }, stepTimeMs);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sound = new SoundEngine();
