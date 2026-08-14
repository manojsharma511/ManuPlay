import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class HoopMasterGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Ball Physics
  private ballX = 100;
  private ballY = 550;
  private ballRadius = 18;
  private vx = 0;
  private vy = 0;
  private gravity = 1100; // Pixels per sec squared
  private isShot = false;

  // Drag Aim State
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;

  // Rim Position
  private rimX = 300;
  private rimY = 220;
  private rimRadius = 32;

  // Game state
  private score = 0;
  private streak = 0;
  private shotsLeft = 10;
  private aimAngle = -Math.PI / 3;
  private aimPower = 750;

  private particles: Particle[] = [];

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

    this.resetBall();
    this.score = 0;
    this.streak = 0;
    this.shotsLeft = 10;
    this.particles = [];

    this.isRunning = true;
    this.isPaused = false;

    this.setupControls();

    audioService.startSynthMusic('runner');
    ManuPlayGameSDK.gameStarted('hoop-master');

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

  private resetBall() {
    this.ballX = 80;
    this.ballY = this.logicalHeight - 140;
    this.vx = 0;
    this.vy = 0;
    this.isShot = false;
  }

  private handleTouchStart = (e: MouseEvent | TouchEvent) => {
    if (!this.isRunning || this.isPaused || this.isShot || this.shotsLeft <= 0) return;
    const rect = this.canvas!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.isDragging = true;
    this.dragStartX = clientX - rect.left;
    this.dragStartY = clientY - rect.top;
    this.dragCurrentX = this.dragStartX;
    this.dragCurrentY = this.dragStartY;
  };

  private handleTouchMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isDragging) return;
    const rect = this.canvas!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.dragCurrentX = clientX - rect.left;
    this.dragCurrentY = clientY - rect.top;

    const dx = this.dragStartX - this.dragCurrentX;
    const dy = this.dragStartY - this.dragCurrentY;

    if (Math.hypot(dx, dy) > 10) {
      this.aimAngle = Math.atan2(-dy, dx);
      this.aimPower = Math.min(1100, Math.max(400, Math.hypot(dx, dy) * 5));
    }
  };

  private handleTouchEnd = () => {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (!this.isShot && this.shotsLeft > 0) {
      this.isShot = true;
      this.shotsLeft--;

      this.vx = Math.cos(this.aimAngle) * this.aimPower;
      this.vy = Math.sin(this.aimAngle) * this.aimPower;

      audioService.playJump();
      storageService.triggerHaptic('light');
    }
  };

  private setupControls() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this.handleTouchStart);
    this.canvas.addEventListener('mousemove', this.handleTouchMove);
    window.addEventListener('mouseup', this.handleTouchEnd);

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd);
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
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleTouchStart);
      this.canvas.removeEventListener('mousemove', this.handleTouchMove);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
    window.removeEventListener('mouseup', this.handleTouchEnd);
    window.removeEventListener('touchend', this.handleTouchEnd);
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

    // Key adjustment
    if (!this.isShot && !this.isDragging) {
      if (input.up) this.aimAngle = Math.max(-Math.PI / 2 + 0.2, this.aimAngle - 1.2 * dt);
      if (input.down) this.aimAngle = Math.min(-0.2, this.aimAngle + 1.2 * dt);

      if (input.action1) {
        this.isShot = true;
        this.shotsLeft--;
        this.vx = Math.cos(this.aimAngle) * this.aimPower;
        this.vy = Math.sin(this.aimAngle) * this.aimPower;

        audioService.playJump();
        storageService.triggerHaptic('light');
      }
    }

    // Ball Movement Physics
    if (this.isShot) {
      this.vy += this.gravity * dt;
      this.ballX += this.vx * dt;
      this.ballY += this.vy * dt;

      // Swish Collision Check
      const distToRim = Math.hypot(this.ballX - this.rimX, this.ballY - this.rimY);
      if (distToRim < this.rimRadius - 5 && this.vy > 0) {
        this.streak++;
        const points = 100 * this.streak;
        this.score += points;
        this.shotsLeft++; // Bonus shot!
        this.onScoreUpdate(this.score);

        audioService.playCoin();
        storageService.triggerHaptic('success');

        for (let i = 0; i < 16; i++) {
          this.particles.push({
            x: this.rimX,
            y: this.rimY,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            color: '#ffaa00',
            life: 0.8
          });
        }

        this.rimY = 180 + Math.random() * 100;
        this.resetBall();
      }

      // Out of bounds / Missed
      if (this.ballY > this.logicalHeight + 40 || this.ballX > this.logicalWidth + 40) {
        this.streak = 0;
        this.resetBall();

        if (this.shotsLeft <= 0) {
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          ManuPlayGameSDK.gameCompleted('hoop-master', this.score);
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }
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

    // Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Backboard & Rim
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.rimX + 25, this.rimY - 40, 10, 60);

    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(this.rimX, this.rimY, this.rimRadius, 0, Math.PI);
    ctx.stroke();

    // Net
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.rimX - this.rimRadius, this.rimY);
    ctx.lineTo(this.rimX - 15, this.rimY + 30);
    ctx.lineTo(this.rimX + 15, this.rimY + 30);
    ctx.lineTo(this.rimX + this.rimRadius, this.rimY);
    ctx.stroke();
    ctx.restore();

    // Trajectory Dots
    if (!this.isShot) {
      ctx.fillStyle = '#00f0ff88';
      let simX = this.ballX;
      let simY = this.ballY;
      let simVx = Math.cos(this.aimAngle) * this.aimPower;
      let simVy = Math.sin(this.aimAngle) * this.aimPower;
      const stepDt = 0.03;

      for (let i = 0; i < 15; i++) {
        simVy += this.gravity * stepDt;
        simX += simVx * stepDt;
        simY += simVy * stepDt;
        ctx.beginPath();
        ctx.arc(simX, simY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Basketball
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6600';
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`🏀 SHOTS LEFT: ${this.shotsLeft}   🔥 STREAK: x${this.streak}`, 20, 35);
    ctx.restore();
  }
}
