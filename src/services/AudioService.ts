import { storageService } from './StorageService';

class AudioService {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicLoopTimer: any = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateVolumes();
  }

  public updateVolumes() {
    const prefs = storageService.getPreferences();
    if (!this.masterGain || !this.musicGain || !this.sfxGain) return;

    const master = prefs.muted ? 0 : prefs.masterVolume;
    this.masterGain.gain.setValueAtTime(master, this.ctx?.currentTime || 0);
    this.musicGain.gain.setValueAtTime(prefs.musicVolume * 0.4, this.ctx?.currentTime || 0);
    this.sfxGain.gain.setValueAtTime(prefs.sfxVolume, this.ctx?.currentTime || 0);
  }

  // Synthesized Sound Effects
  public playClick() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playJump() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playLaser() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playCoin() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.3);
  }

  public playEngine(active: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    if (!active) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playGameOver() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    const notes = [400, 350, 300, 220];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * 0.12 + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.12);
      osc.stop(now + (i + 1) * 0.12 + 0.05);
    });
  }

  public playSfx(type: 'pop' | 'powerup' | 'win' | 'gameover' | 'click' | 'coin' | 'explosion') {
    switch (type) {
      case 'pop':
      case 'click':
        this.playClick();
        break;
      case 'powerup':
      case 'coin':
        this.playCoin();
        break;
      case 'win':
        this.playJump();
        break;
      case 'gameover':
      case 'explosion':
        this.playGameOver();
        break;
    }
  }

  // Synth Background Music Loop
  public startSynthMusic(theme: 'racing' | 'runner' | 'action' | 'puzzle' | 'arcade' | 'sports' = 'arcade') {
    this.stopSynthMusic();
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;

    this.isMusicPlaying = true;
    let step = 0;
    
    const scaleMap: Record<string, number[]> = {
      racing: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63],
      sports: [146.83, 164.81, 196.00, 220.00, 246.94, 293.66],
      runner: [220.00, 246.94, 277.18, 329.63, 369.99, 440.00],
      action: [110.00, 116.54, 130.81, 138.59, 146.83, 164.81],
      puzzle: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
      arcade: [174.61, 196.00, 220.00, 261.63, 293.66, 349.23]
    };

    const notes = scaleMap[theme] || scaleMap.arcade;

    this.musicLoopTimer = setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const prefs = storageService.getPreferences();
      if (prefs.muted || prefs.musicVolume === 0) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = notes[step % notes.length];
      osc.type = theme === 'action' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.25);

      step++;
    }, 250);
  }

  public stopSynthMusic() {
    this.isMusicPlaying = false;
    if (this.musicLoopTimer) {
      clearInterval(this.musicLoopTimer);
      this.musicLoopTimer = null;
    }
  }
}

export const audioService = new AudioService();
