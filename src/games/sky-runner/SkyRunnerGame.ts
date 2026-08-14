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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class SkyRunnerGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player Physics
  private playerX = 80;
  private playerY = 0;
  private playerRadius = 18;
  private vy = 0;
  private gravity = 1200; // Pixels per sec squared
  private jumpPower = -520; // Initial jump velocity
  private jumpsRemaining = 2;
  private wasJumpPressed = false;

  // Game World State
  private score = 0;
  private speed = 360; // Base horizontal scroll speed
  private platforms: Platform[] = [];
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

    this.playerX = 80;
    this.playerY = this.logicalHeight / 2;
    this.vy = 0;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.speed = 360;
    this.platforms = [];
    this.particles = [];

    // Initial platform
    this.platforms.push({
      x: 0,
      y: this.logicalHeight / 2 + 30,
      width: 450,
      height: 24
    });

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('runner');

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
    audioService.startSynthMusic('runner');
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

    // Speed progression
    this.speed += 8 * dt;
    this.score += Math.round(60 * dt);
    this.onScoreUpdate(this.score);

    // Jump Handling (Tap / Key / Swipe Up)
    const isJumpPressed = input.action1 || input.up || input.swipeUp;
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
            vx: (Math.random() - 0.5) * 160,
            vy: Math.random() * 120,
            color: '#ff007f',
            life: 0.6
          });
        }
      }
    }
    this.wasJumpPressed = isJumpPressed;

    // Apply Gravity & Update Player Y
    this.vy += this.gravity * dt;
    this.playerY += this.vy * dt;

    // Platform Spawning
    const lastPlat = this.platforms[this.platforms.length - 1];
    if (lastPlat && lastPlat.x + lastPlat.width < this.logicalWidth + 200) {
      const gap = 100 + Math.random() * 130;
      const width = 180 + Math.random() * 220;
      const height = 24;
      const y = Math.max(200, Math.min(this.logicalHeight - 150, lastPlat.y + (Math.random() - 0.5) * 160));

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

    // Platform Collision & Scroll
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.x -= this.speed * dt;
      if (p.orbX) p.orbX -= this.speed * dt;

      // Landing Collision
      if (
        this.playerX + this.playerRadius > p.x &&
        this.playerX - this.playerRadius < p.x + p.width &&
        this.playerY + this.playerRadius >= p.y &&
        this.playerY + this.playerRadius <= p.y + p.height + this.vy * dt + 6 &&
        this.vy >= 0
      ) {
        this.playerY = p.y - this.playerRadius;
        this.vy = 0;
        this.jumpsRemaining = 2;

        // Check Spike Collision
        if (p.hasSpike && Math.abs(this.playerX - (p.x + p.width / 2)) < 28) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }

      // Collect Plasma Orb
      if (p.orbX && p.orbY && !p.collected) {
        const dist = Math.hypot(this.playerX - p.orbX, this.playerY - p.orbY);
        if (dist < this.playerRadius + 15) {
          p.collected = true;
          this.score += 300;
          audioService.playCoin();
          storageService.triggerHaptic('light');

          for (let k = 0; k < 12; k++) {
            this.particles.push({
              x: p.orbX,
              y: p.orbY,
              vx: (Math.random() - 0.5) * 200,
              vy: (Math.random() - 0.5) * 200,
              color: '#00f0ff',
              life: 0.5
            });
          }
        }
      }

      if (p.x + p.width < -100) {
        this.platforms.splice(i, 1);
      }
    }

    // Fall Check
    if (this.playerY > this.logicalHeight + 60) {
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
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0c14');
    bgGrad.addColorStop(1, '#1b0d2d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Platforms
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
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Player Hero
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
