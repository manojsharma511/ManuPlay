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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class SpaceShooterGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player State
  private shipX = 80;
  private shipY = 225;
  private shipRadius = 18;
  private hp = 100;
  private shield = 50;
  private weaponType: 'single' | 'triple' = 'single';
  private lastFired = 0;

  // Game World State
  private score = 0;
  private level = 1;
  private enemies: EnemyShip[] = [];
  private bullets: StarBullet[] = [];
  private powerups: PowerUp[] = [];
  private stars: Array<{ x: number; y: number; speed: number; size: number }> = [];
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

    this.shipX = 80;
    this.shipY = this.logicalHeight / 2;
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
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        speed: 60 + Math.random() * 240,
        size: Math.random() * 2.5
      });
    }

    this.setupTouchDrag();

    this.unsubscribeInput = inputService.subscribe(() => {});
    audioService.startSynthMusic('arcade');

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

  private setupTouchDrag() {
    if (!this.canvas) return;

    let isDragging = false;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const dx = touchX - lastTouchX;
      const dy = touchY - lastTouchY;

      this.shipX = Math.max(30, Math.min(this.logicalWidth / 2, this.shipX + dx));
      this.shipY = Math.max(30, Math.min(this.logicalHeight - 30, this.shipY + dy));

      lastTouchX = touchX;
      lastTouchY = touchY;
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    this.canvas.addEventListener('touchend', handleTouchEnd);
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('arcade');
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

    // Key Movement
    const spd = 360;
    if (input.left) this.shipX = Math.max(30, this.shipX - spd * dt);
    if (input.right) this.shipX = Math.min(this.logicalWidth / 2, this.shipX + spd * dt);
    if (input.up) this.shipY = Math.max(30, this.shipY - spd * dt);
    if (input.down) this.shipY = Math.min(this.logicalHeight - 30, this.shipY + spd * dt);

    if (input.joystick.active) {
      this.shipX = Math.max(30, Math.min(this.logicalWidth / 2, this.shipX + input.joystick.x * spd * dt));
      this.shipY = Math.max(30, Math.min(this.logicalHeight - 30, this.shipY + input.joystick.y * spd * dt));
    }

    // Starfield scroll
    this.stars.forEach(s => {
      s.x -= s.speed * dt;
      if (s.x < 0) s.x = this.logicalWidth;
    });

    // Auto/Manual Laser Fire
    const now = Date.now();
    if (now - this.lastFired > 140) {
      this.lastFired = now;
      audioService.playLaser();

      const bSpd = 850;
      if (this.weaponType === 'single') {
        this.bullets.push({ x: this.shipX + 20, y: this.shipY, vx: bSpd, vy: 0 });
      } else {
        this.bullets.push({ x: this.shipX + 20, y: this.shipY - 10, vx: bSpd, vy: -120 });
        this.bullets.push({ x: this.shipX + 20, y: this.shipY, vx: bSpd, vy: 0 });
        this.bullets.push({ x: this.shipX + 20, y: this.shipY + 10, vx: bSpd, vy: 120 });
      }
    }

    // Level calculation & Spawn Enemies
    this.level = Math.floor(this.score / 1500) + 1;
    if (Math.random() < 0.035 + this.level * 0.005) {
      const isBoss = Math.random() < 0.05 && this.score > 2000;
      this.enemies.push({
        x: this.logicalWidth + 40,
        y: 40 + Math.random() * (this.logicalHeight - 80),
        hp: isBoss ? 150 : 20,
        maxHp: isBoss ? 150 : 20,
        type: isBoss ? 'boss' : Math.random() < 0.3 ? 'heavy' : 'scout',
        color: isBoss ? '#ff0055' : Math.random() < 0.5 ? '#ffaa00' : '#9900ff',
        vy: (Math.random() - 0.5) * 180
      });
    }

    // Update Bullets & Enemy Collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

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

            if (Math.random() < 0.3) {
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

      if (b.x > this.logicalWidth + 50) this.bullets.splice(i, 1);
    }

    // Update Enemies & Ship Collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x -= 200 * dt;
      e.y += e.vy * dt;
      if (e.y < 30 || e.y > this.logicalHeight - 30) e.vy *= -1;

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
      p.x -= 120 * dt;
      if (Math.hypot(this.shipX - p.x, this.shipY - p.y) < this.shipRadius + 18) {
        audioService.playCoin();
        storageService.triggerHaptic('light');
        if (p.type === 'triple') this.weaponType = 'triple';
        else this.shield = Math.min(100, this.shield + 50);
        this.powerups.splice(i, 1);
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

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 300,
        color,
        life: 0.8
      });
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

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
      ctx.globalAlpha = Math.max(0, pt.life);
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
