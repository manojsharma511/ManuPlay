import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MiniGolfGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Ball State
  private ballX = 100;
  private ballY = 400;
  private ballRadius = 10;
  private vx = 0;
  private vy = 0;
  private friction = 0.98;

  // Drag Aim State
  private isAiming = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;

  // Hole & Course
  private holeX = 300;
  private holeY = 120;
  private holeRadius = 16;
  private strokeCount = 0;
  private holeNumber = 1;
  private score = 0;
  private obstacles: Obstacle[] = [];

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

    this.holeNumber = 1;
    this.score = 0;
    this.strokeCount = 0;

    this.isRunning = true;
    this.isPaused = false;

    this.setupHole(this.holeNumber);
    this.setupTouch();

    audioService.startSynthMusic('runner');
    ManuPlayGameSDK.gameStarted('mini-golf');

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

  private setupHole(num: number) {
    this.ballX = this.logicalWidth / 2;
    this.ballY = this.logicalHeight - 120;
    this.vx = 0;
    this.vy = 0;
    this.holeX = 100 + Math.random() * (this.logicalWidth - 200);
    this.holeY = 120 + Math.random() * 80;

    this.obstacles = [];
    for (let k = 0; k < Math.min(4, num); k++) {
      this.obstacles.push({
        x: 60 + Math.random() * (this.logicalWidth - 160),
        y: 220 + k * 80,
        width: 100,
        height: 16
      });
    }
  }

  private handleTouchStart = (e: MouseEvent | TouchEvent) => {
    if (!this.canvas || !this.isRunning || this.isPaused || Math.hypot(this.vx, this.vy) > 10) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.isAiming = true;
    this.dragStartX = clientX - rect.left;
    this.dragStartY = clientY - rect.top;
    this.dragCurrentX = this.dragStartX;
    this.dragCurrentY = this.dragStartY;
  };

  private handleTouchMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isAiming) return;
    const rect = this.canvas!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.dragCurrentX = clientX - rect.left;
    this.dragCurrentY = clientY - rect.top;
  };

  private handleTouchEnd = () => {
    if (!this.isAiming) return;
    this.isAiming = false;

    const dx = this.dragStartX - this.dragCurrentX;
    const dy = this.dragStartY - this.dragCurrentY;
    const power = Math.min(700, Math.hypot(dx, dy) * 4);

    if (power > 50) {
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * power;
      this.vy = Math.sin(angle) * power;
      this.strokeCount++;

      audioService.playJump();
      storageService.triggerHaptic('light');
    }
  };

  private setupTouch() {
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
    // Ball Movement Physics
    this.ballX += this.vx * dt;
    this.ballY += this.vy * dt;

    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);

    if (Math.hypot(this.vx, this.vy) < 5) {
      this.vx = 0;
      this.vy = 0;
    }

    // Boundary Bounce
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    if (this.ballX < 30 || this.ballX > w - 30) {
      this.vx *= -0.8;
      this.ballX = Math.max(30, Math.min(w - 30, this.ballX));
      audioService.playClick();
    }
    if (this.ballY < 30 || this.ballY > h - 30) {
      this.vy *= -0.8;
      this.ballY = Math.max(30, Math.min(h - 30, this.ballY));
      audioService.playClick();
    }

    // Obstacle Bounce
    this.obstacles.forEach(ob => {
      if (
        this.ballX + this.ballRadius > ob.x &&
        this.ballX - this.ballRadius < ob.x + ob.width &&
        this.ballY + this.ballRadius > ob.y &&
        this.ballY - this.ballRadius < ob.y + ob.height
      ) {
        this.vy *= -0.85;
        this.vx *= -0.85;
        audioService.playClick();
      }
    });

    // Check Hole In!
    if (Math.hypot(this.ballX - this.holeX, this.ballY - this.holeY) < this.holeRadius) {
      audioService.playCoin();
      storageService.triggerHaptic('success');

      const holeScore = Math.max(100, 500 - this.strokeCount * 50);
      this.score += holeScore;
      this.onScoreUpdate(this.score);

      this.holeNumber++;
      this.strokeCount = 0;

      if (this.holeNumber > 5) {
        audioService.playGameOver();
        ManuPlayGameSDK.gameCompleted('mini-golf', this.score);
        this.destroy();
        this.onGameOver(this.score);
      } else {
        this.setupHole(this.holeNumber);
      }
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Green Course Background
    ctx.fillStyle = '#0f291e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1a4332';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Hole
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.holeX, this.holeY, this.holeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Flag pole
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.holeX, this.holeY);
    ctx.lineTo(this.holeX, this.holeY - 30);
    ctx.stroke();

    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(this.holeX, this.holeY - 30);
    ctx.lineTo(this.holeX - 16, this.holeY - 22);
    ctx.lineTo(this.holeX, this.holeY - 14);
    ctx.fill();
    ctx.restore();

    // Obstacles
    this.obstacles.forEach(ob => {
      ctx.save();
      ctx.fillStyle = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffaa00';
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
      ctx.restore();
    });

    // Drag Aim Line Preview
    if (this.isAiming) {
      const dx = this.dragStartX - this.dragCurrentX;
      const dy = this.dragStartY - this.dragCurrentY;

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.ballX, this.ballY);
      ctx.lineTo(this.ballX + dx * 0.8, this.ballY + dy * 0.8);
      ctx.stroke();
      ctx.restore();
    }

    // White Golf Ball
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`⛳ HOLE: ${this.holeNumber}/5   🏌️ STROKES: ${this.strokeCount}`, 30, 45);
    ctx.restore();
  }
}
