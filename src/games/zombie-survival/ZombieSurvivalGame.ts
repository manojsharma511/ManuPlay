import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface Zombie {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface ItemDrop {
  x: number;
  y: number;
  type: 'health' | 'nuke';
}

export class ZombieSurvivalGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player state
  private playerX = 400;
  private playerY = 225;
  private playerRadius = 16;
  private hp = 100;
  private aimAngle = 0;
  private lastFired = 0;

  // Game state
  private score = 0;
  private wave = 1;
  private zombies: Zombie[] = [];
  private bullets: Bullet[] = [];
  private items: ItemDrop[] = [];
  private particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }> = [];
  private nextZombieId = 1;
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
    this.playerY = canvas.height / 2;
    this.hp = 100;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.wave = 1;
    this.zombies = [];
    this.bullets = [];
    this.items = [];
    this.particles = [];

    this.spawnWave(this.wave);

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('action');
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

  private spawnWave(waveNum: number) {
    if (!this.canvas) return;
    const count = 5 + waveNum * 4;
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * this.canvas.width; y = -40; }
      else if (side === 1) { x = this.canvas.width + 40; y = Math.random() * this.canvas.height; }
      else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + 40; }
      else { x = -40; y = Math.random() * this.canvas.height; }

      this.zombies.push({
        id: this.nextZombieId++,
        x,
        y,
        hp: 20 + waveNum * 5,
        maxHp: 20 + waveNum * 5,
        speed: 1.2 + Math.random() * 0.8 + waveNum * 0.1,
        color: waveNum % 2 === 0 ? '#ffaa00' : '#00ff88'
      });
    }
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    audioService.startSynthMusic('action');
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

    // Movement
    const speed = 4;
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.playerX = Math.max(20, Math.min(this.canvas.width - 20, this.playerX + dx * speed));
    this.playerY = Math.max(20, Math.min(this.canvas.height - 20, this.playerY + dy * speed));

    if (dx !== 0 || dy !== 0) {
      this.aimAngle = Math.atan2(dy, dx);
    }

    // Firing
    const now = Date.now();
    if ((input.action1 || input.action2) && now - this.lastFired > 160) {
      this.lastFired = now;
      audioService.playLaser();
      storageService.triggerHaptic('light');

      const spd = 12;
      this.bullets.push({
        x: this.playerX + Math.cos(this.aimAngle) * 20,
        y: this.playerY + Math.sin(this.aimAngle) * 20,
        vx: Math.cos(this.aimAngle) * spd,
        vy: Math.sin(this.aimAngle) * spd,
        life: 1.0
      });
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life -= 0.02;

      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const z = this.zombies[j];
        if (Math.hypot(b.x - z.x, b.y - z.y) < 18) {
          z.hp -= 15;
          this.bullets.splice(i, 1);

          for (let p = 0; p < 4; p++) {
            this.particles.push({
              x: z.x,
              y: z.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: z.color,
              life: 0.5
            });
          }

          if (z.hp <= 0) {
            audioService.playExplosion();
            this.score += 100;
            this.onScoreUpdate(this.score);

            if (Math.random() < 0.2) {
              this.items.push({
                x: z.x,
                y: z.y,
                type: Math.random() < 0.7 ? 'health' : 'nuke'
              });
            }

            this.zombies.splice(j, 1);
          }
          break;
        }
      }

      if (b.life <= 0 || b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Zombies & Collision with Player
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      const angle = Math.atan2(this.playerY - z.y, this.playerX - z.x);
      z.x += Math.cos(angle) * z.speed;
      z.y += Math.sin(angle) * z.speed;

      if (Math.hypot(this.playerX - z.x, this.playerY - z.y) < this.playerRadius + 14) {
        this.hp -= 0.5;
        storageService.triggerHaptic('medium');
        if (this.hp <= 0) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }
    }

    // Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.hypot(this.playerX - it.x, this.playerY - it.y) < this.playerRadius + 16) {
        if (it.type === 'health') {
          audioService.playCoin();
          this.hp = Math.min(100, this.hp + 30);
        } else {
          audioService.playExplosion();
          this.zombies.forEach(z => {
            this.score += 50;
            this.createExplosion(z.x, z.y, z.color);
          });
          this.zombies = [];
        }
        this.items.splice(i, 1);
      }
    }

    // Check Wave Progression
    if (this.zombies.length === 0) {
      this.wave++;
      this.score += 500;
      audioService.playCoin();
      this.spawnWave(this.wave);
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

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 0.7
      });
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Arena Floor
    ctx.fillStyle = '#0f1322';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1e2642';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw Items
    this.items.forEach(it => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = it.type === 'health' ? '#00ff88' : '#ffaa00';
      ctx.fillStyle = it.type === 'health' ? '#00ff88' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(it.x, it.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.type === 'health' ? '+' : '💣', it.x, it.y);
      ctx.restore();
    });

    // Draw Bullets
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
      ctx.stroke();
    });

    // Draw Zombies
    this.zombies.forEach(z => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = z.color;
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.x, z.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0055';
      ctx.fillRect(z.x - 12, z.y - 20, 24, 4);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(z.x - 12, z.y - 20, (z.hp / z.maxHp) * 24, 4);
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

    // Player Hero
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, this.playerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.playerX, this.playerY);
    ctx.lineTo(this.playerX + Math.cos(this.aimAngle) * 24, this.playerY + Math.sin(this.aimAngle) * 24);
    ctx.stroke();
    ctx.restore();

    // HUD: Health Bar & Wave Counter
    ctx.save();
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(20, 20, 160, 16);
    ctx.fillStyle = this.hp > 30 ? '#00ff88' : '#ff0055';
    ctx.fillRect(20, 20, (this.hp / 100) * 160, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`HEALTH ${Math.ceil(this.hp)}%`, 25, 33);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`WAVE ${this.wave}`, w - 100, 33);
    ctx.restore();
  }
}
