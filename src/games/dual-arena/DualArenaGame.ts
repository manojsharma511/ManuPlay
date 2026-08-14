import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 1 | 2;
}

export class DualArenaGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player 1 (Cyan)
  private p1X = 100;
  private p1Y = 225;
  private p1Hp = 100;
  private p1Score = 0;

  // Player 2 (Magenta)
  private p2X = 700;
  private p2Y = 225;
  private p2Hp = 100;
  private p2Score = 0;

  private bullets: Bullet[] = [];
  private keys: Record<string, boolean> = {};

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

    this.p1X = 100;
    this.p1Y = this.logicalHeight / 2;
    this.p1Hp = 100;
    this.p1Score = 0;

    this.p2X = this.logicalWidth - 100;
    this.p2Y = this.logicalHeight / 2;
    this.p2Hp = 100;
    this.p2Score = 0;

    this.bullets = [];
    this.keys = {};

    this.isRunning = true;
    this.isPaused = false;

    this.setupListeners();

    audioService.startSynthMusic('action');
    ManuPlayGameSDK.gameStarted('dual-arena');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
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

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // P1 Fire (Space / KeyF)
      if (e.code === 'KeyF' || e.code === 'Space') {
        this.fireBullet(1);
      }
      // P2 Fire (Enter / KeyL)
      if (e.code === 'Enter' || e.code === 'KeyL') {
        this.fireBullet(2);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch split controls
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', (e) => {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.clientX < window.innerWidth / 2) {
            this.fireBullet(1);
          } else {
            this.fireBullet(2);
          }
        }
      }, { passive: true });
    }
  }

  private fireBullet(owner: 1 | 2) {
    if (!this.isRunning || this.isPaused) return;

    audioService.playLaser();
    storageService.triggerHaptic('light');

    if (owner === 1) {
      this.bullets.push({ x: this.p1X + 20, y: this.p1Y, vx: 600, vy: 0, owner: 1 });
    } else {
      this.bullets.push({ x: this.p2X - 20, y: this.p2Y, vx: -600, vy: 0, owner: 2 });
    }
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('action');
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
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
    const spd = 300;

    // P1 Movement (WASD)
    if (this.keys['KeyW']) this.p1Y = Math.max(30, this.p1Y - spd * dt);
    if (this.keys['KeyS']) this.p1Y = Math.min(this.logicalHeight - 30, this.p1Y + spd * dt);
    if (this.keys['KeyA']) this.p1X = Math.max(30, this.p1X - spd * dt);
    if (this.keys['KeyD']) this.p1X = Math.min(this.logicalWidth / 2 - 20, this.p1X + spd * dt);

    // P2 Movement (Arrow Keys)
    if (this.keys['ArrowUp']) this.p2Y = Math.max(30, this.p2Y - spd * dt);
    if (this.keys['ArrowDown']) this.p2Y = Math.min(this.logicalHeight - 30, this.p2Y + spd * dt);
    if (this.keys['ArrowLeft']) this.p2X = Math.max(this.logicalWidth / 2 + 20, this.p2X - spd * dt);
    if (this.keys['ArrowRight']) this.p2X = Math.min(this.logicalWidth - 30, this.p2X + spd * dt);

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.owner === 1 && Math.hypot(b.x - this.p2X, b.y - this.p2Y) < 22) {
        this.p2Hp -= 20;
        this.p1Score += 100;
        audioService.playExplosion();
        storageService.triggerHaptic('medium');
        this.bullets.splice(i, 1);

        if (this.p2Hp <= 0) {
          audioService.playGameOver();
          this.onScoreUpdate(this.p1Score);
          this.destroy();
          this.onGameOver(this.p1Score);
          return;
        }
        continue;
      }

      if (b.owner === 2 && Math.hypot(b.x - this.p1X, b.y - this.p1Y) < 22) {
        this.p1Hp -= 20;
        this.p2Score += 100;
        audioService.playExplosion();
        storageService.triggerHaptic('medium');
        this.bullets.splice(i, 1);

        if (this.p1Hp <= 0) {
          audioService.playGameOver();
          this.onScoreUpdate(this.p2Score);
          this.destroy();
          this.onGameOver(this.p2Score);
          return;
        }
        continue;
      }

      if (b.x < 0 || b.x > this.logicalWidth) this.bullets.splice(i, 1);
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Arena Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Center Net Divider
    ctx.strokeStyle = '#00f0ff33';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bullets
    this.bullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.owner === 1 ? '#00f0ff' : '#ff007f';
      ctx.fillStyle = b.owner === 1 ? '#00f0ff' : '#ff007f';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // P1 (Cyan)
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(this.p1X, this.p1Y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(this.p1X - 16, this.p1Y - 28, 32, 4);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(this.p1X - 16, this.p1Y - 28, (this.p1Hp / 100) * 32, 4);
    ctx.restore();

    // P2 (Magenta)
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(this.p2X, this.p2Y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(this.p2X - 16, this.p2Y - 28, 32, 4);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(this.p2X - 16, this.p2Y - 28, (this.p2Hp / 100) * 32, 4);
    ctx.restore();

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`PLAYER 1: ${this.p1Score}`, 30, 35);
    ctx.fillText(`PLAYER 2: ${this.p2Score}`, w - 140, 35);
    ctx.restore();
  }
}
