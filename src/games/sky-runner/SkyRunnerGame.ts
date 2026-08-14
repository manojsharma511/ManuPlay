import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  hasSpike?: boolean;
  orbX?: number;
  orbY?: number;
  collected?: boolean;
}

export class SkyRunnerGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player physics
  private playerX = 80;
  private playerY = 0;
  private playerRadius = 18;
  private vy = 0;
  private gravity = 0.65;
  private jumpPower = -13;
  private jumpsRemaining = 2;
  private wasJumpPressed = false;

  // Game state
  private score = 0;
  private speed = 6;
  private platforms: Platform[] = [];
  private particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }> = [];
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
    this.playerX = 80;
    this.playerY = canvas.height / 2;
    this.vy = 0;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.speed = 6;
    this.platforms = [];
    this.particles = [];

    // Starting platform
    this.platforms.push({
      x: 0,
      y: canvas.height / 2 + 30,
      width: 400,
      height: 24
    });

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('runner');
    this.loop();
  }

  private resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 400;
      this.canvas.height = parent.clientHeight || 700;
    }
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    audioService.startSynthMusic('runner');
    this.loop();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.unsubscribeInput) this.unsubscribeInput();
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (!this.canvas) return;
    const input = inputService.getState();

    // Speed progression
    this.speed += 0.0015;
    this.score += 1;
    this.onScoreUpdate(this.score);

    // Jump Input
    const isJumpPressed = input.action1 || input.up;
    if (isJumpPressed && !this.wasJumpPressed) {
      if (this.jumpsRemaining > 0) {
        this.vy = this.jumpPower;
        this.jumpsRemaining--;
        audioService.playJump();
        storageService.triggerHaptic('light');

        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x: this.playerX,
            y: this.playerY + this.playerRadius,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3,
            color: '#ff007f',
            life: 0.6
          });
        }
      }
    }
    this.wasJumpPressed = isJumpPressed;

    // Apply Gravity
    this.vy += this.gravity;
    this.playerY += this.vy;

    // Platform spawning
    const lastPlat = this.platforms[this.platforms.length - 1];
    if (lastPlat && lastPlat.x + lastPlat.width < this.canvas.width + 200) {
      const gap = 90 + Math.random() * 120;
      const width = 180 + Math.random() * 220;
      const height = 24;
      const y = Math.max(200, Math.min(this.canvas.height - 150, lastPlat.y + (Math.random() - 0.5) * 160));

      const hasSpike = Math.random() < 0.35;
      const orbX = lastPlat.x + lastPlat.width + gap + width / 2;
      const orbY = y - 45;

      this.platforms.push({
        x: lastPlat.x + lastPlat.width + gap,
        y,
        width,
        height,
        hasSpike,
        orbX,
        orbY
      });
    }

    // Platform collision & scroll
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.x -= this.speed;
      if (p.orbX) p.orbX -= this.speed;

      // Top landing collision
      if (
        this.playerX + this.playerRadius > p.x &&
        this.playerX - this.playerRadius < p.x + p.width &&
        this.playerY + this.playerRadius >= p.y &&
        this.playerY + this.playerRadius <= p.y + p.height + this.vy &&
        this.vy >= 0
      ) {
        this.playerY = p.y - this.playerRadius;
        this.vy = 0;
        this.jumpsRemaining = 2;

        // Check Spike Collision
        if (p.hasSpike && Math.abs(this.playerX - (p.x + p.width / 2)) < 30) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }

      // Collect Orb
      if (p.orbX && !p.collected) {
        const dist = Math.hypot(this.playerX - p.orbX, this.playerY - (p.orbY || 0));
        if (dist < this.playerRadius + 15) {
          p.collected = true;
          this.score += 300;
          audioService.playCoin();
          storageService.triggerHaptic('light');
        }
      }

      if (p.x + p.width < -100) {
        this.platforms.splice(i, 1);
      }
    }

    // Fall below screen check
    if (this.playerY > this.canvas.height + 60) {
      audioService.playExplosion();
      audioService.playGameOver();
      storageService.triggerHaptic('error');
      this.destroy();
      this.onGameOver(this.score);
      return;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0c14');
    bgGrad.addColorStop(1, '#1b0d2d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Platforms
    this.platforms.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff007f';
      ctx.fillStyle = '#ff007f';

      ctx.fillRect(p.x, p.y, p.width, 6);

      ctx.fillStyle = '#1e1030';
      ctx.fillRect(p.x, p.y + 6, p.width, p.height - 6);

      if (p.hasSpike) {
        const spikeX = p.x + p.width / 2;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(spikeX - 16, p.y);
        ctx.lineTo(spikeX, p.y - 18);
        ctx.lineTo(spikeX + 16, p.y);
        ctx.fill();
      }

      if (p.orbX && p.orbY && !p.collected) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.orbX, p.orbY, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Player Orb Character
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, this.playerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
