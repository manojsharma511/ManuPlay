import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Gate {
  x: number;
  topY: number;
  gapHeight: number;
  width: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class NeonWingsGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Wing character physics
  private birdX = 80;
  private birdY = 300;
  private birdRadius = 16;
  private vy = 0;
  private gravity = 1000; // Pixels per sec squared
  private flapPower = -420; // Upward impulse
  private wasFlapPressed = false;

  // Game World State
  private score = 0;
  private gatesPassed = 0;
  private speed = 210; // Scroll speed
  private gates: Gate[] = [];
  private particles: Particle[] = [];
  private unsubscribeInput: (() => void) | null = null;

  constructor(
    onGameOver: (score: number) => void,
    onScoreUpdate: (score: number) => void
  ) {
    this.onGameOver = onGameOver;
    this.onScoreUpdate = onScoreUpdate;
  }

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.resize();
    window.addEventListener('resize', this.resize);

    this.birdX = 80;
    this.birdY = this.logicalHeight / 2;
    this.vy = 0;
    this.score = 0;
    this.gatesPassed = 0;
    this.gates = [];
    this.particles = [];

    this.isRunning = true;
    this.isPaused = false;

    this.unsubscribeInput = inputService.subscribe(() => {});

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('neon-wings');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 400;
      const height = parent.clientHeight || 700;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      if (this.ctx) {
        this.ctx.scale(dpr, dpr);
      }
    }
  };

  private get logicalWidth(): number {
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 400;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 700;
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('arcade');
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.unsubscribeInput) this.unsubscribeInput();
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning || this.isPaused) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const input = inputService.getState();

    // Flap Input (Tap / Key / Swipe)
    const isFlapPressed = input.action1 || input.up || input.swipeUp;
    if (isFlapPressed && !this.wasFlapPressed) {
      this.vy = this.flapPower;
      audioService.playJump();
      storageService.triggerHaptic('light');

      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.birdX - 10,
          y: this.birdY,
          vx: (Math.random() - 0.5) * 120,
          vy: Math.random() * 120,
          color: '#00f0ff',
          life: 0.5
        });
      }
    }
    this.wasFlapPressed = isFlapPressed;

    // Apply Gravity
    this.vy += this.gravity * dt;
    this.birdY += this.vy * dt;

    // Gate Spawning
    const lastGate = this.gates[this.gates.length - 1];
    if (!lastGate || lastGate.x < this.logicalWidth - 200) {
      const gapHeight = 160;
      const topY = 80 + Math.random() * (this.logicalHeight - 300);
      this.gates.push({
        x: this.logicalWidth + 50,
        topY,
        gapHeight,
        width: 50,
        passed: false
      });
    }

    // Gate Movement & Collision
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.x -= this.speed * dt;

      // Collision Check
      if (
        this.birdX + this.birdRadius > g.x &&
        this.birdX - this.birdRadius < g.x + g.width
      ) {
        if (this.birdY - this.birdRadius < g.topY || this.birdY + this.birdRadius > g.topY + g.gapHeight) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          ManuPlayGameSDK.gameCompleted('neon-wings', this.score);
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }

      // Check Gate Passed
      if (!g.passed && g.x + g.width < this.birdX) {
        g.passed = true;
        this.gatesPassed++;
        this.score += 100;
        this.onScoreUpdate(this.score);
        audioService.playCoin();
        storageService.triggerHaptic('light');
      }

      if (g.x < -100) this.gates.splice(i, 1);
    }

    // Ground / Ceiling Collision Check
    if (this.birdY < 10 || this.birdY > this.logicalHeight - 10) {
      audioService.playExplosion();
      audioService.playGameOver();
      storageService.triggerHaptic('error');
      ManuPlayGameSDK.gameCompleted('neon-wings', this.score);
      this.destroy();
      this.onGameOver(this.score);
      return;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Background Gradient
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Glowing Gates
    this.gates.forEach(g => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = '#00f0ff';

      ctx.fillRect(g.x, 0, g.width, g.topY);
      ctx.fillRect(g.x, g.topY + g.gapHeight, g.width, h - (g.topY + g.gapHeight));
      ctx.restore();
    });

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Neon Wing Character
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(this.birdX, this.birdY, this.birdRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(this.birdX - 10, this.birdY);
    ctx.lineTo(this.birdX - 25, this.birdY - 12);
    ctx.lineTo(this.birdX - 5, this.birdY - 4);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`🦩 GATES: ${this.gatesPassed}`, 20, 40);
    ctx.restore();
  }
}
