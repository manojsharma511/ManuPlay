import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface TrafficCar {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface Pickup {
  x: number;
  y: number;
  type: 'nitro' | 'coin';
  radius: number;
}

export class NeonDriftGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player state
  private playerX = 0;
  private playerY = 0;
  private playerWidth = 44;
  private playerHeight = 80;
  private nitroAmount = 100;
  private isBoosting = false;

  // Game state
  private score = 0;
  private speed = 6;
  private traffic: TrafficCar[] = [];
  private pickups: Pickup[] = [];
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
    this.playerX = canvas.width / 2;
    this.playerY = canvas.height - 120;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.speed = 6;
    this.nitroAmount = 100;
    this.traffic = [];
    this.pickups = [];
    this.particles = [];

    this.unsubscribeInput = inputService.subscribe(() => {});

    audioService.startSynthMusic('racing');
    this.loop();
  }

  private resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 800;
      this.canvas.height = parent.clientHeight || 450;
    }
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    audioService.startSynthMusic('racing');
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

    // Nitro handling
    if ((input.action1 || input.up) && this.nitroAmount > 0) {
      this.isBoosting = true;
      this.speed = 12;
      this.nitroAmount = Math.max(0, this.nitroAmount - 0.8);
      audioService.playEngine(true);
    } else {
      this.isBoosting = false;
      this.speed = 6;
      if (this.nitroAmount < 100) this.nitroAmount += 0.2;
    }

    // Horizontal Movement
    const turnSpeed = 7;
    if (input.left) {
      this.playerX = Math.max(this.playerWidth / 2 + 20, this.playerX - turnSpeed);
    }
    if (input.right) {
      this.playerX = Math.min(this.canvas.width - this.playerWidth / 2 - 20, this.playerX + turnSpeed);
    }

    // Score accumulation
    this.score += Math.round(this.speed * 0.5);
    this.onScoreUpdate(this.score);

    // Spawn Traffic
    if (Math.random() < 0.025) {
      const colors = ['#ff0055', '#ffaa00', '#00ff88', '#e000ff'];
      const laneWidth = (this.canvas.width - 80) / 4;
      const lane = Math.floor(Math.random() * 4);
      const spawnX = 40 + lane * laneWidth + laneWidth / 2;

      this.traffic.push({
        x: spawnX,
        y: -100,
        width: 40,
        height: 75,
        speed: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Spawn Pickups
    if (Math.random() < 0.015) {
      const type = Math.random() < 0.3 ? 'nitro' : 'coin';
      this.pickups.push({
        x: 40 + Math.random() * (this.canvas.width - 80),
        y: -50,
        type,
        radius: 16
      });
    }

    // Move & Collision with Traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.y += this.speed - t.speed;

      if (
        Math.abs(this.playerX - t.x) < (this.playerWidth + t.width) / 2 - 8 &&
        Math.abs(this.playerY - t.y) < (this.playerHeight + t.height) / 2 - 8
      ) {
        if (this.isBoosting) {
          audioService.playExplosion();
          storageService.triggerHaptic('medium');
          this.createExplosion(t.x, t.y, t.color);
          this.traffic.splice(i, 1);
          this.score += 500;
          continue;
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

      if (t.y > this.canvas.height + 100) {
        this.traffic.splice(i, 1);
      }
    }

    // Move & Collision with Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.y += this.speed;

      const dist = Math.hypot(this.playerX - p.x, this.playerY - p.y);
      if (dist < p.radius + 20) {
        if (p.type === 'coin') {
          audioService.playCoin();
          storageService.triggerHaptic('light');
          this.score += 250;
        } else {
          audioService.playJump();
          storageService.triggerHaptic('light');
          this.nitroAmount = Math.min(100, this.nitroAmount + 40);
        }
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.y > this.canvas.height + 50) {
        this.pickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.03;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 1.0
      });
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Highway Road & Grid Lines
    ctx.strokeStyle = '#00f0ff22';
    ctx.lineWidth = 2;
    const laneWidth = (w - 80) / 4;

    for (let i = 0; i <= 4; i++) {
      const x = 40 + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Moving Road Dash Lines
    ctx.strokeStyle = '#00f0ff66';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -((Date.now() / 8) % 60);

    for (let i = 1; i < 4; i++) {
      const x = 40 + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Pickups
    this.pickups.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.type === 'coin' ? '#ffaa00' : '#00f0ff';
      ctx.fillStyle = p.type === 'coin' ? '#ffaa00' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'coin' ? '★' : '⚡', p.x, p.y);
      ctx.restore();
    });

    // Draw Traffic Cars
    this.traffic.forEach(t => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = t.color;
      ctx.fillStyle = t.color;

      ctx.beginPath();
      ctx.roundRect(t.x - t.width / 2, t.y - t.height / 2, t.width, t.height, 8);
      ctx.fill();

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(t.x - t.width / 2 + 4, t.y + t.height / 2 - 6, 8, 4);
      ctx.fillRect(t.x + t.width / 2 - 12, t.y + t.height / 2 - 6, 8, 4);
      ctx.restore();
    });

    // Draw Player Neon Car
    ctx.save();
    ctx.shadowBlur = this.isBoosting ? 25 : 15;
    ctx.shadowColor = this.isBoosting ? '#ff00ff' : '#00f0ff';
    ctx.fillStyle = '#00f0ff';

    ctx.beginPath();
    ctx.roundRect(this.playerX - this.playerWidth / 2, this.playerY - this.playerHeight / 2, this.playerWidth, this.playerHeight, 10);
    ctx.fill();

    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(this.playerX - 14, this.playerY - 20, 28, 16);

    ctx.fillStyle = this.isBoosting ? '#ff007f' : '#ffffff';
    ctx.fillRect(this.playerX - 18, this.playerY - this.playerHeight / 2 + 4, 8, 6);
    ctx.fillRect(this.playerX + 10, this.playerY - this.playerHeight / 2 + 4, 8, 6);

    if (this.isBoosting) {
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(this.playerX - 10, this.playerY + this.playerHeight / 2);
      ctx.lineTo(this.playerX, this.playerY + this.playerHeight / 2 + 25 + Math.random() * 10);
      ctx.lineTo(this.playerX + 10, this.playerY + this.playerHeight / 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD: Nitro Bar
    ctx.save();
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(20, 20, 150, 16);
    ctx.fillStyle = this.nitroAmount > 30 ? '#00f0ff' : '#ff0055';
    ctx.fillRect(20, 20, (this.nitroAmount / 100) * 150, 16);
    ctx.strokeStyle = '#ffffff66';
    ctx.strokeRect(20, 20, 150, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('NITRO BOOST', 25, 32);
    ctx.restore();
  }
}
