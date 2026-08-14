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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export class NeonDriftGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player State
  private playerX = 0;
  private playerY = 0;
  private playerWidth = 44;
  private playerHeight = 80;
  private nitroAmount = 100;
  private isBoosting = false;

  // Game World State
  private score = 0;
  private speed = 360; // Pixels per second base speed
  private traffic: TrafficCar[] = [];
  private pickups: Pickup[] = [];
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

    this.playerX = this.canvas.width / 2;
    this.playerY = this.canvas.height - 120;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.speed = 360;
    this.nitroAmount = 100;
    this.traffic = [];
    this.pickups = [];
    this.particles = [];
    this.shakeTimer = 0;

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

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Cap delta to 50ms
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const input = inputService.getState();

    // Nitro handling
    if ((input.boost || input.action1 || input.up) && this.nitroAmount > 0) {
      this.isBoosting = true;
      this.speed = 750;
      this.nitroAmount = Math.max(0, this.nitroAmount - 35 * dt);
      audioService.playEngine(true);

      // Exhaust particles
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.playerX + (Math.random() - 0.5) * 10,
          y: this.playerY + this.playerHeight / 2,
          vx: (Math.random() - 0.5) * 40,
          vy: 200 + Math.random() * 150,
          color: '#ff00ff',
          life: 0.4,
          size: 4 + Math.random() * 4
        });
      }
    } else {
      this.isBoosting = false;
      this.speed = 360;
      if (this.nitroAmount < 100) this.nitroAmount += 15 * dt;
    }

    // Steering Movement
    const turnSpeed = 420;
    if (input.left) {
      this.playerX = Math.max(this.playerWidth / 2 + 20, this.playerX - turnSpeed * dt);
    }
    if (input.right) {
      this.playerX = Math.min(this.logicalWidth - this.playerWidth / 2 - 20, this.playerX + turnSpeed * dt);
    }

    // Score accumulation
    this.score += Math.round(this.speed * dt * 0.5);
    this.onScoreUpdate(this.score);

    // Spawn Traffic
    if (Math.random() < 0.04) {
      const colors = ['#ff0055', '#ffaa00', '#00ff88', '#e000ff'];
      const laneWidth = (this.logicalWidth - 80) / 4;
      const lane = Math.floor(Math.random() * 4);
      const spawnX = 40 + lane * laneWidth + laneWidth / 2;

      this.traffic.push({
        x: spawnX,
        y: -100,
        width: 40,
        height: 75,
        speed: 100 + Math.random() * 150,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Spawn Pickups
    if (Math.random() < 0.02) {
      const type = Math.random() < 0.35 ? 'nitro' : 'coin';
      this.pickups.push({
        x: 40 + Math.random() * (this.logicalWidth - 80),
        y: -50,
        type,
        radius: 16
      });
    }

    // Update & Collision with Traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.y += (this.speed - t.speed) * dt;

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
          this.shakeTimer = 0.2;
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

      if (t.y > this.logicalHeight + 100) {
        this.traffic.splice(i, 1);
      }
    }

    // Update & Collision with Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.y += this.speed * dt;

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

      if (p.y > this.logicalHeight + 50) {
        this.pickups.splice(i, 1);
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

    if (this.shakeTimer > 0) this.shakeTimer -= dt;
  }

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 0.6 + Math.random() * 0.4,
        size: 3 + Math.random() * 4
      });
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    ctx.save();

    // Screen Shake
    if (this.shakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 12;
      const shakeY = (Math.random() - 0.5) * 12;
      ctx.translate(shakeX, shakeY);
    }

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
    ctx.lineDashOffset = -((Date.now() / 4) % 60);

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
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
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

    ctx.restore();
  }
}
