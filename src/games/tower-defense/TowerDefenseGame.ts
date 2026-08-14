import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Creep {
  id: number;
  pathIndex: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  isBoss?: boolean;
}

interface Tower {
  x: number;
  y: number;
  type: 'laser' | 'cannon' | 'frost';
  range: number;
  damage: number;
  cooldown: number;
  lastFired: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class TowerDefenseGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private gold = 150;
  private lives = 10;
  private wave = 1;
  private score = 0;
  private selectedTowerType: 'laser' | 'cannon' | 'frost' = 'laser';

  private pathNodes: Array<{ x: number; y: number }> = [];
  private creeps: Creep[] = [];
  private towers: Tower[] = [];
  private particles: Particle[] = [];
  private nextCreepId = 1;
  private waveTimers: any[] = [];

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
    this.buildMapPath();

    this.gold = 150;
    this.lives = 10;
    this.wave = 1;
    this.score = 0;
    this.creeps = [];
    this.towers = [];
    this.particles = [];
    this.waveTimers = [];

    this.isRunning = true;
    this.isPaused = false;

    this.setupCanvasClick();
    this.spawnWave(this.wave);

    audioService.startSynthMusic('action');
    ManuPlayGameSDK.gameStarted('tower-defense');

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
      this.buildMapPath();
    }
  };

  private get logicalWidth(): number {
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 800;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 450;
  }

  private buildMapPath() {
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    this.pathNodes = [
      { x: -20, y: h * 0.25 },
      { x: w * 0.3, y: h * 0.25 },
      { x: w * 0.3, y: h * 0.75 },
      { x: w * 0.7, y: h * 0.75 },
      { x: w * 0.7, y: h * 0.3 },
      { x: w + 40, y: h * 0.3 }
    ];
  }

  private handleCanvasClick = (e: MouseEvent | TouchEvent) => {
    if (!this.canvas || !this.isRunning || this.isPaused) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Check UI Toolbar Clicks at bottom
    if (clickY > this.logicalHeight - 55) {
      const options: Array<'laser' | 'cannon' | 'frost'> = ['laser', 'cannon', 'frost'];
      options.forEach((opt, idx) => {
        const btnX = 30 + idx * 75;
        if (clickX >= btnX && clickX <= btnX + 65) {
          this.selectedTowerType = opt;
          audioService.playClick();
          storageService.triggerHaptic('light');
        }
      });
      return;
    }

    // Place Tower on Map
    const costs = { laser: 50, cannon: 80, frost: 70 };
    const cost = costs[this.selectedTowerType];

    if (this.gold >= cost) {
      this.gold -= cost;
      audioService.playJump();
      storageService.triggerHaptic('light');

      const properties = {
        laser: { range: 120, damage: 18, cooldown: 300, color: '#00f0ff' },
        cannon: { range: 100, damage: 45, cooldown: 800, color: '#ff007f' },
        frost: { range: 90, damage: 10, cooldown: 500, color: '#9900ff' }
      };

      const prop = properties[this.selectedTowerType];
      this.towers.push({
        x: clickX,
        y: clickY,
        type: this.selectedTowerType,
        range: prop.range,
        damage: prop.damage,
        cooldown: prop.cooldown,
        lastFired: 0,
        color: prop.color
      });
    }
  };

  private setupCanvasClick() {
    if (!this.canvas) return;
    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: true });
  }

  private spawnWave(waveNum: number) {
    this.clearWaveTimers();
    const count = 6 + waveNum * 3;
    for (let i = 0; i < count; i++) {
      const timer = setTimeout(() => {
        if (!this.isRunning || this.isPaused) return;
        const isBoss = i === count - 1 && waveNum % 5 === 0;
        this.creeps.push({
          id: this.nextCreepId++,
          pathIndex: 0,
          x: this.pathNodes[0].x,
          y: this.pathNodes[0].y,
          hp: isBoss ? 300 + waveNum * 100 : 40 + waveNum * 15,
          maxHp: isBoss ? 300 + waveNum * 100 : 40 + waveNum * 15,
          speed: isBoss ? 45 : 80 + Math.random() * 25,
          color: isBoss ? '#ffaa00' : waveNum % 2 === 0 ? '#00ff88' : '#00f0ff',
          isBoss
        });
      }, i * 700);
      this.waveTimers.push(timer);
    }
  }

  private clearWaveTimers() {
    this.waveTimers.forEach(t => clearTimeout(t));
    this.waveTimers = [];
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
    this.clearWaveTimers();
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
      this.canvas.removeEventListener('touchstart', this.handleCanvasClick);
    }
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
    const now = Date.now();

    // Creep Path Movement
    for (let i = this.creeps.length - 1; i >= 0; i--) {
      const c = this.creeps[i];
      const targetNode = this.pathNodes[c.pathIndex + 1];

      if (targetNode) {
        const dx = targetNode.x - c.x;
        const dy = targetNode.y - c.y;
        const dist = Math.hypot(dx, dy);
        const step = c.speed * dt;

        if (dist < step) {
          c.pathIndex++;
          if (c.pathIndex >= this.pathNodes.length - 1) {
            this.lives--;
            storageService.triggerHaptic('medium');
            this.creeps.splice(i, 1);

            if (this.lives <= 0) {
              audioService.playGameOver();
              storageService.triggerHaptic('error');
              ManuPlayGameSDK.gameCompleted('tower-defense', this.score);
              this.destroy();
              this.onGameOver(this.score);
              return;
            }
            continue;
          }
        } else {
          c.x += (dx / dist) * step;
          c.y += (dy / dist) * step;
        }
      }
    }

    // Tower Attacks
    this.towers.forEach(t => {
      if (now - t.lastFired > t.cooldown) {
        const target = this.creeps.find(c => Math.hypot(c.x - t.x, c.y - t.y) <= t.range);
        if (target) {
          t.lastFired = now;
          target.hp -= t.damage;
          audioService.playLaser();

          if (t.type === 'frost') {
            target.speed = Math.max(30, target.speed * 0.7);
          }

          for (let p = 0; p < 3; p++) {
            this.particles.push({
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              color: t.color,
              life: 0.5
            });
          }

          if (target.hp <= 0) {
            const idx = this.creeps.indexOf(target);
            if (idx >= 0) {
              this.creeps.splice(idx, 1);
              audioService.playCoin();
              this.gold += target.isBoss ? 50 : 15;
              this.score += target.isBoss ? 300 : 50;
              this.onScoreUpdate(this.score);
            }
          }
        }
      }
    });

    if (this.creeps.length === 0 && this.waveTimers.length === 0) {
      this.wave++;
      this.gold += 30;
      this.spawnWave(this.wave);
    }

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

    // Map Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Creep Path Road
    ctx.strokeStyle = '#1e2642';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.pathNodes.forEach((node, i) => {
      if (i === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();

    // Render Towers & Range Circles
    this.towers.forEach(t => {
      ctx.save();
      ctx.strokeStyle = `${t.color}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 12;
      ctx.shadowColor = t.color;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Creeps
    this.creeps.forEach(c => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = c.color;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.isBoss ? 16 : 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0055';
      ctx.fillRect(c.x - 12, c.y - 18, 24, 3);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(c.x - 12, c.y - 18, (c.hp / c.maxHp) * 24, 3);
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

    // Top HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`💰 GOLD: ${this.gold}   ❤️ LIVES: ${this.lives}   🌊 WAVE: ${this.wave}`, 20, 30);

    // Bottom Tower Toolbar
    ctx.fillStyle = '#121524';
    ctx.fillRect(20, h - 50, 240, 40);
    ctx.strokeStyle = '#282e4a';
    ctx.strokeRect(20, h - 50, 240, 40);

    const options: Array<{ type: 'laser' | 'cannon' | 'frost'; label: string; cost: number; color: string }> = [
      { type: 'laser', label: 'Laser', cost: 50, color: '#00f0ff' },
      { type: 'cannon', label: 'Cannon', cost: 80, color: '#ff007f' },
      { type: 'frost', label: 'Frost', cost: 70, color: '#9900ff' }
    ];

    options.forEach((opt, idx) => {
      const btnX = 30 + idx * 75;
      const isSelected = this.selectedTowerType === opt.type;

      ctx.fillStyle = isSelected ? opt.color : '#1e2338';
      ctx.fillRect(btnX, h - 45, 65, 30);
      ctx.fillStyle = isSelected ? '#000' : '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${opt.label} (${opt.cost})`, btnX + 5, h - 25);
    });

    ctx.restore();
  }
}
