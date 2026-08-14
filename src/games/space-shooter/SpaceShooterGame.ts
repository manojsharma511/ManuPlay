import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface EnemyShip {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: 'scout' | 'heavy' | 'boss';
  color: string;
  vy: number;
}

interface StarBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'triple' | 'shield';
}

export class SpaceShooterGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player state
  private shipX = 80;
  private shipY = 225;
  private shipRadius = 18;
  private hp = 100;
  private shield = 0;
  private weaponType: 'single' | 'triple' = 'single';
  private lastFired = 0;

  // Game state
  private score = 0;
  private level = 1;
  private enemies: EnemyShip[] = [];
  private bullets: StarBullet[] = [];
  private powerups: PowerUp[] = [];
  private stars: Array<{ x: number; y: number; speed: number; size: number }> = [];
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
    this.shipX = 80;
    this.shipY = canvas.height / 2;
    this.hp = 100;
    this.shield = 50;

    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.weaponType = 'single';

    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.particles = [];

    // Background Stars
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 4,
        size: Math.random() * 2.5
      });
    }

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('arcade');
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
    audioService.startSynthMusic('arcade');
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

    // Move Ship
    const spd = 6;
    if (input.left) this.shipX = Math.max(30, this.shipX - spd);
    if (input.right) this.shipX = Math.min(this.canvas.width / 2, this.shipX + spd);
    if (input.up) this.shipY = Math.max(30, this.shipY - spd);
    if (input.down) this.shipY = Math.min(this.canvas.height - 30, this.shipY + spd);

    // Starfield scroll
    this.stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = this.canvas!.width;
    });

    // Fire Lasers
    const now = Date.now();
    if ((input.action1 || input.action2) && now - this.lastFired > 140) {
      this.lastFired = now;
      audioService.playLaser();
      storageService.triggerHaptic('light');

      if (this.weaponType === 'single') {
        this.bullets.push({ x: this.shipX + 20, y: this.shipY, vx: 14, vy: 0 });
      } else {
        this.bullets.push({ x: this.shipX + 20, y: this.shipY - 10, vx: 14, vy: -2 });
        this.bullets.push({ x: this.shipX + 20, y: this.shipY, vx: 14, vy: 0 });
        this.bullets.push({ x: this.shipX + 20, y: this.shipY + 10, vx: 14, vy: 2 });
      }
    }

    // Spawn Enemies
    if (Math.random() < 0.03 + this.level * 0.005) {
      const isBoss = Math.random() < 0.05 && this.score > 2000;
      this.enemies.push({
        x: this.canvas.width + 40,
        y: 40 + Math.random() * (this.canvas.height - 80),
        hp: isBoss ? 150 : 20,
        maxHp: isBoss ? 150 : 20,
        type: isBoss ? 'boss' : Math.random() < 0.3 ? 'heavy' : 'scout',
        color: isBoss ? '#ff0055' : Math.random() < 0.5 ? '#ffaa00' : '#9900ff',
        vy: (Math.random() - 0.5) * 3
      });
    }

    // Update Bullets & Collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < (e.type === 'boss' ? 40 : 22)) {
          e.hp -= 15;
          this.bullets.splice(i, 1);

          if (e.hp <= 0) {
            audioService.playExplosion();
            this.createExplosion(e.x, e.y, e.color);
            this.score += e.type === 'boss' ? 1000 : 150;
            this.onScoreUpdate(this.score);

            // Powerup drop
            if (Math.random() < 0.25) {
              this.powerups.push({
                x: e.x,
                y: e.y,
                type: Math.random() < 0.5 ? 'triple' : 'shield'
              });
            }

            this.enemies.splice(j, 1);
          }
          break;
        }
      }

      if (b.x > this.canvas.width + 50) this.bullets.splice(i, 1);
    }

    // Update Enemies & Ship Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x -= 3.5;
      e.y += e.vy;
      if (e.y < 30 || e.y > this.canvas.height - 30) e.vy *= -1;

      if (Math.hypot(this.shipX - e.x, this.shipY - e.y) < this.shipRadius + (e.type === 'boss' ? 35 : 18)) {
        if (this.shield > 0) {
          this.shield = Math.max(0, this.shield - 30);
        } else {
          this.hp -= 25;
        }
        storageService.triggerHaptic('medium');
        this.enemies.splice(i, 1);

        if (this.hp <= 0) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }

      if (e.x < -60) this.enemies.splice(i, 1);
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.x -= 2;
      if (Math.hypot(this.shipX - p.x, this.shipY - p.y) < this.shipRadius + 18) {
        audioService.playCoin();
        if (p.type === 'triple') this.weaponType = 'triple';
        else this.shield = Math.min(100, this.shield + 50);
        this.powerups.splice(i, 1);
      }
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
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 0.8
      });
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Space Background
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    this.stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Powerups
    this.powerups.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.type === 'triple' ? '#00ff88' : '#00f0ff';
      ctx.fillStyle = p.type === 'triple' ? '#00ff88' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'triple' ? '3X' : '🛡️', p.x, p.y);
      ctx.restore();
    });

    // Laser Bullets
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + 16, b.y);
      ctx.stroke();
    });

    // Enemy Ships
    this.enemies.forEach(e => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = e.color;
      ctx.fillStyle = e.color;

      ctx.beginPath();
      const r = e.type === 'boss' ? 35 : 18;
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fill();
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

    // Player Starship
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff';

    ctx.beginPath();
    ctx.moveTo(this.shipX + 24, this.shipY);
    ctx.lineTo(this.shipX - 16, this.shipY - 16);
    ctx.lineTo(this.shipX - 8, this.shipY);
    ctx.lineTo(this.shipX - 16, this.shipY + 16);
    ctx.closePath();
    ctx.fill();

    // Shield Aura
    if (this.shield > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.shipX, this.shipY, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // HUD: HP & Shield
    ctx.save();
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(20, 20, 140, 14);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(20, 20, (this.hp / 100) * 140, 14);

    if (this.shield > 0) {
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(20, 40, 140, 10);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(20, 40, (this.shield / 100) * 140, 10);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`HULL ${Math.ceil(this.hp)}%`, 24, 31);
    ctx.restore();
  }
}
