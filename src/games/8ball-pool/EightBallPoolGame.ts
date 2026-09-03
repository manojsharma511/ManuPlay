import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isCue: boolean;
  isPocketed: boolean;
}

export class EightBallPoolGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private balls: Ball[] = [];
  private cueBall: Ball | null = null;
  private isAiming = false;
  private aimAngle = 0;
  private shotPower = 0;
  private score = 0;

  private pointerStart: { x: number; y: number } | null = null;

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
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);

    this.setupTable();
    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private setupTable() {
    this.balls = [];
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Cue ball
    this.cueBall = {
      id: 0,
      x: w * 0.3,
      y: h / 2,
      vx: 0,
      vy: 0,
      radius: 12,
      color: '#ffffff',
      isCue: true,
      isPocketed: false
    };
    this.balls.push(this.cueBall);

    // Rack target balls
    const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#10b981', '#1e293b', '#ec4899'];
    let ballId = 1;
    const startX = w * 0.7;
    const startY = h / 2;
    const r = 12;

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row <= col; row++) {
        this.balls.push({
          id: ballId,
          x: startX + col * (r * 1.8),
          y: startY + (row - col / 2) * (r * 2.1),
          vx: 0,
          vy: 0,
          radius: r,
          color: colors[ballId % colors.length],
          isCue: false,
          isPocketed: false
        });
        ballId++;
      }
    }
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 800;
      const height = parent.clientHeight || 450;

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
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 800;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 450;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    }
    window.removeEventListener('resize', this.resize);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.cueBall || this.isMoving()) return;
    const rect = this.canvas!.getBoundingClientRect();
    this.pointerStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this.isAiming = true;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isAiming || !this.pointerStart || !this.cueBall) return;
    const rect = this.canvas!.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const dx = this.pointerStart.x - curX;
    const dy = this.pointerStart.y - curY;

    this.aimAngle = Math.atan2(dy, dx);
    this.shotPower = Math.min(100, Math.hypot(dx, dy));
  };

  private handlePointerUp = () => {
    if (!this.isAiming || !this.cueBall) return;
    this.isAiming = false;

    if (this.shotPower > 10) {
      const speed = this.shotPower * 12;
      this.cueBall.vx = Math.cos(this.aimAngle) * speed;
      this.cueBall.vy = Math.sin(this.aimAngle) * speed;
      audioService.playJump();
      storageService.triggerHaptic('medium');
    }
    this.shotPower = 0;
  };

  private isMoving(): boolean {
    return this.balls.some(b => !b.isPocketed && (Math.abs(b.vx) > 5 || Math.abs(b.vy) > 5));
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
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const padding = 40;

    // Table pockets
    const pockets = [
      { x: padding, y: padding },
      { x: w / 2, y: padding - 5 },
      { x: w - padding, y: padding },
      { x: padding, y: h - padding },
      { x: w / 2, y: h - padding + 5 },
      { x: w - padding, y: h - padding }
    ];

    // Physics & movement
    this.balls.forEach(b => {
      if (b.isPocketed) return;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Friction
      b.vx *= 0.985;
      b.vy *= 0.985;

      if (Math.hypot(b.vx, b.vy) < 2) {
        b.vx = 0;
        b.vy = 0;
      }

      // Cushion bounces
      if (b.x < padding + b.radius) { b.x = padding + b.radius; b.vx *= -0.85; }
      if (b.x > w - padding - b.radius) { b.x = w - padding - b.radius; b.vx *= -0.85; }
      if (b.y < padding + b.radius) { b.y = padding + b.radius; b.vy *= -0.85; }
      if (b.y > h - padding - b.radius) { b.y = h - padding - b.radius; b.vy *= -0.85; }

      // Pocket check
      pockets.forEach(p => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < 24) {
          b.isPocketed = true;
          b.vx = 0;
          b.vy = 0;

          if (b.isCue) {
            // Scratch! Reset cue ball
            setTimeout(() => {
              b.x = w * 0.3;
              b.y = h / 2;
              b.isPocketed = false;
            }, 600);
          } else {
            audioService.playCoin();
            storageService.triggerHaptic('success');
            this.score += 500;
            this.onScoreUpdate(this.score);
          }
        }
      });
    });

    // Ball-to-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        if (b1.isPocketed || b2.isPocketed) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < b1.radius + b2.radius) {
          // Elastic collision calculation
          const nx = dx / dist;
          const ny = dy / dist;
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          b1.vx -= p * nx;
          b1.vy -= p * ny;
          b2.vx += p * nx;
          b2.vy += p * ny;

          // Push apart
          const overlap = b1.radius + b2.radius - dist;
          b1.x -= nx * overlap * 0.5;
          b1.y -= ny * overlap * 0.5;
          b2.x += nx * overlap * 0.5;
          b2.y += ny * overlap * 0.5;

          audioService.playCoin();
        }
      }
    }

    // Check game over (all target balls pocketed)
    const activeTargets = this.balls.filter(b => !b.isCue && !b.isPocketed);
    if (activeTargets.length === 0) {
      audioService.playGameOver();
      this.destroy();
      this.onGameOver(this.score + 2000);
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const padding = 40;

    // Outer table felt
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    // Inner green cloth
    ctx.fillStyle = '#059669';
    ctx.fillRect(padding, padding, w - padding * 2, h - padding * 2);

    // Pockets
    const pockets = [
      { x: padding, y: padding },
      { x: w / 2, y: padding - 5 },
      { x: w - padding, y: padding },
      { x: padding, y: h - padding },
      { x: w / 2, y: h - padding + 5 },
      { x: w - padding, y: h - padding }
    ];

    ctx.fillStyle = '#020617';
    pockets.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Aim Line
    if (this.isAiming && this.cueBall && this.shotPower > 5) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(this.cueBall.x, this.cueBall.y);
      ctx.lineTo(
        this.cueBall.x + Math.cos(this.aimAngle) * 200,
        this.cueBall.y + Math.sin(this.aimAngle) * 200
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Balls
    this.balls.forEach(b => {
      if (b.isPocketed) return;
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00000044';
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball shine
      ctx.fillStyle = '#ffffff66';
      ctx.beginPath();
      ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DRAG BACKWARDS TO AIM & SHOOT CUE BALL', 20, 25);
  }
}
