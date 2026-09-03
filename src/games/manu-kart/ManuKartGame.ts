import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface KartAI {
  x: number;
  y: number;
  speed: number;
  color: string;
  name: string;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'nitro' | 'shield' | 'coin';
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export class ManuKartGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private playerX = 0;
  private playerY = 0;
  private playerWidth = 46;
  private playerHeight = 75;
  private nitroAmount = 100;
  private isBoosting = false;
  private isDrifting = false;

  private score = 0;


  private speed = 400;
  private distance = 0;
  private opponents: KartAI[] = [];
  private powerups: PowerUp[] = [];
  private particles: Particle[] = [];
  private shakeTimer = 0;
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

    this.playerX = this.logicalWidth / 2;
    this.playerY = this.logicalHeight - 110;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.distance = 0;
    this.speed = 400;
    this.nitroAmount = 100;
    this.opponents = [];
    this.powerups = [];
    this.particles = [];
    this.shakeTimer = 0;

    // Spawn AI karts
    const names = ['ApexRacer', 'TurboViper', 'NeonStorm', 'BlazeKart'];
    const colors = ['#ff0055', '#ffaa00', '#00ff88', '#9900ff'];
    for (let i = 0; i < 4; i++) {
      this.opponents.push({
        x: 100 + i * 150,
        y: -150 - i * 180,
        speed: 320 + Math.random() * 120,
        color: colors[i],
        name: names[i]
      });
    }

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('racing');

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

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('racing');
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

    // Nitro / Boost
    if ((input.boost || input.action1 || input.up) && this.nitroAmount > 0) {
      this.isBoosting = true;
      this.speed = 800;
      this.nitroAmount = Math.max(0, this.nitroAmount - 40 * dt);
      audioService.playEngine(true);

      if (Math.random() < 0.7) {
        this.particles.push({
          x: this.playerX + (Math.random() - 0.5) * 12,
          y: this.playerY + this.playerHeight / 2,
          vx: (Math.random() - 0.5) * 60,
          vy: 250 + Math.random() * 150,
          color: '#00f0ff',
          life: 0.3,
          size: 4 + Math.random() * 5
        });
      }
    } else {
      this.isBoosting = false;
      this.speed = 420;
      if (this.nitroAmount < 100) this.nitroAmount += 18 * dt;
    }

    // Steering & Drifting
    const turnSpeed = 460;
    this.isDrifting = (input.left || input.right) && this.isBoosting;

    if (this.isDrifting && Math.random() < 0.5) {
      this.particles.push({
        x: this.playerX + (Math.random() - 0.5) * 20,
        y: this.playerY + 20,
        vx: (Math.random() - 0.5) * 30,
        vy: 100,
        color: '#94a3b8',
        life: 0.25,
        size: 3 + Math.random() * 3
      });
    }

    if (input.left) {
      this.playerX = Math.max(this.playerWidth / 2 + 30, this.playerX - turnSpeed * dt);
    }
    if (input.right) {
      this.playerX = Math.min(this.logicalWidth - this.playerWidth / 2 - 30, this.playerX + turnSpeed * dt);
    }

    // Score / Distance
    this.distance += this.speed * dt;
    this.score = Math.round(this.distance * 0.4);
    this.onScoreUpdate(this.score);

    // Opponent AI Update
    for (let i = 0; i < this.opponents.length; i++) {
      const opp = this.opponents[i];
      opp.y += (this.speed - opp.speed) * dt;

      // Slight AI lane weaving
      opp.x += Math.sin(Date.now() / 300 + i) * 0.8;

      // Reset AI if off screen
      if (opp.y > this.logicalHeight + 120) {
        opp.y = -150 - Math.random() * 200;
        opp.x = 60 + Math.random() * (this.logicalWidth - 120);
        opp.speed = 340 + Math.random() * 150;
      }

      // Collision check
      if (
        Math.abs(this.playerX - opp.x) < (this.playerWidth + 40) / 2 &&
        Math.abs(this.playerY - opp.y) < (this.playerHeight + 70) / 2
      ) {
        if (this.isBoosting) {
          audioService.playExplosion();
          storageService.triggerHaptic('medium');
          this.createExplosion(opp.x, opp.y, opp.color);
          opp.y = -200;
          this.score += 750;
          this.shakeTimer = 0.25;
        } else {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.createExplosion(this.playerX, this.playerY, '#00f0ff');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }
    }

    // Powerups
    if (Math.random() < 0.025) {
      this.powerups.push({
        x: 60 + Math.random() * (this.logicalWidth - 120),
        y: -60,
        type: Math.random() < 0.4 ? 'nitro' : 'coin',
        radius: 18
      });
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += this.speed * dt;

      const dist = Math.hypot(this.playerX - p.x, this.playerY - p.y);
      if (dist < p.radius + 22) {
        if (p.type === 'coin') {
          audioService.playCoin();
          storageService.triggerHaptic('light');
          this.score += 350;
        } else {
          audioService.playJump();
          storageService.triggerHaptic('light');
          this.nitroAmount = Math.min(100, this.nitroAmount + 50);
        }
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.logicalHeight + 60) this.powerups.splice(i, 1);
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    if (this.shakeTimer > 0) this.shakeTimer -= dt;
  }

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 140 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 0.5 + Math.random() * 0.5,
        size: 4 + Math.random() * 5
      });
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    ctx.save();

    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
    }

    // Track Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Track Grass borders
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 30, h);
    ctx.fillRect(w - 30, 0, 30, h);

    // Road grid lines
    ctx.strokeStyle = '#38bdf822';
    ctx.lineWidth = 2;
    const laneW = (w - 60) / 4;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * laneW, 0);
      ctx.lineTo(30 + i * laneW, h);
      ctx.stroke();
    }

    // Moving lane dividers
    ctx.strokeStyle = '#e2e8f088';
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = -((Date.now() / 3) % 50);

    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * laneW, 0);
      ctx.lineTo(30 + i * laneW, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Powerups
    this.powerups.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = p.type === 'coin' ? '#f59e0b' : '#38bdf8';
      ctx.fillStyle = p.type === 'coin' ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'coin' ? '★' : '⚡', p.x, p.y);
      ctx.restore();
    });

    // Draw Opponent Karts
    this.opponents.forEach(opp => {
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = opp.color;
      ctx.fillStyle = opp.color;

      ctx.beginPath();
      ctx.roundRect(opp.x - 20, opp.y - 35, 40, 70, 8);
      ctx.fill();

      // Kart wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(opp.x - 24, opp.y - 28, 6, 14);
      ctx.fillRect(opp.x + 18, opp.y - 28, 6, 14);
      ctx.fillRect(opp.x - 24, opp.y + 14, 6, 14);
      ctx.fillRect(opp.x + 18, opp.y + 14, 6, 14);
      ctx.restore();
    });

    // Draw Player Manu Kart
    ctx.save();
    ctx.shadowBlur = this.isBoosting ? 26 : 16;
    ctx.shadowColor = this.isBoosting ? '#a855f7' : '#38bdf8';
    ctx.fillStyle = '#00f0ff';

    ctx.beginPath();
    ctx.roundRect(this.playerX - this.playerWidth / 2, this.playerY - this.playerHeight / 2, this.playerWidth, this.playerHeight, 12);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.playerX - this.playerWidth / 2 - 5, this.playerY - 26, 7, 16);
    ctx.fillRect(this.playerX + this.playerWidth / 2 - 2, this.playerY - 26, 7, 16);
    ctx.fillRect(this.playerX - this.playerWidth / 2 - 5, this.playerY + 10, 7, 16);
    ctx.fillRect(this.playerX + this.playerWidth / 2 - 2, this.playerY + 10, 7, 16);

    // Driver helmet
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY - 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Nitro exhaust flame
    if (this.isBoosting) {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(this.playerX - 12, this.playerY + this.playerHeight / 2);
      ctx.lineTo(this.playerX, this.playerY + this.playerHeight / 2 + 30 + Math.random() * 12);
      ctx.lineTo(this.playerX + 12, this.playerY + this.playerHeight / 2);
      ctx.fill();
    }
    ctx.restore();

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD: Nitro meter
    ctx.save();
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(20, 20, 160, 18);
    ctx.fillStyle = this.nitroAmount > 30 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(20, 20, (this.nitroAmount / 100) * 160, 18);
    ctx.strokeStyle = '#ffffff66';
    ctx.strokeRect(20, 20, 160, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('MANU KART NITRO', 26, 33);
    ctx.restore();

    ctx.restore();
  }
}
