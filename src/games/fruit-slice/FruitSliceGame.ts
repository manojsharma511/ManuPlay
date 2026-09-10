import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Fruit {
  id: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sliced: boolean;
  isBomb: boolean;
}

interface SlicePoint {
  x: number;
  y: number;
  life: number;
}

const FRUIT_TYPES = ['🍉', '🍊', '🍍', '🍎', '🍓', '🥑'];

export class FruitSliceGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private targetSlices = 20;
  private slicedCount = 0;

  private fruits: Fruit[] = [];
  private sliceTrail: SlicePoint[] = [];
  private spawnTimer = 0;

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

    storageService.loadGameState('fruit-slice').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('fruit-slice');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.slicedCount = 0;
    this.targetSlices = 15 + lvl * 3;
    this.fruits = [];
    this.sliceTrail = [];
    this.spawnTimer = 0;
  }

  private setupControls() {
    if (this.canvas) {
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
    }
  }

  private removeControls() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    }
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.sliceTrail.push({ x, y, life: 1.0 });

    // Check fruit slice collision
    for (const f of this.fruits) {
      if (!f.sliced) {
        const dist = Math.hypot(x - f.x, y - f.y);
        if (dist < f.radius + 15) {
          f.sliced = true;
          if (f.isBomb) {
            // Bomb hit! Game Over
            this.handleGameOver();
            return;
          } else {
            this.slicedCount++;
            this.score += 50;
            this.onScoreUpdate(this.score);
            storageService.triggerHaptic('medium');
            audioService.playSfx('powerup');

            // Check level complete
            if (this.slicedCount >= this.targetSlices) {
              if (this.level < 100) {
                this.level++;
                storageService.saveGameState('fruit-slice', {
                  unlockedLevels: this.level,
                  highScore: this.score
                });
                storageService.triggerHaptic('success');
                audioService.playSfx('win');
                this.setupLevel(this.level);
              }
            }
          }
        }
      }
    }
  };

  private spawnFruit() {
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const isBomb = this.level > 5 && Math.random() < 0.25;

    this.fruits.push({
      id: Date.now() + Math.random(),
      type: isBomb ? '💣' : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
      x: 50 + Math.random() * (width - 100),
      y: height + 20,
      vx: (Math.random() - 0.5) * 6,
      vy: -(12 + Math.random() * 4 + this.level * 0.1),
      radius: isBomb ? 26 : 30,
      sliced: false,
      isBomb
    });
  }

  private handleGameOver() {
    this.isRunning = false;
    storageService.triggerHaptic('error');
    audioService.playSfx('gameover');
    this.onGameOver(this.score);
  }

  private get logicalWidth(): number {
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 400;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 700;
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
      if (this.ctx) this.ctx.scale(dpr, dpr);
    }
  };

  private loop = () => {
    if (!this.isRunning) return;
    if (!this.isPaused) {
      this.update();
      this.render();
    }
    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    // Spawning logic
    this.spawnTimer++;
    if (this.spawnTimer > Math.max(30, 80 - this.level)) {
      this.spawnTimer = 0;
      this.spawnFruit();
    }

    // Fruit physics
    const gravity = 0.35;
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += gravity;

      if (f.y > this.logicalHeight + 60) {
        this.fruits.splice(i, 1);
      }
    }

    // Slice trail decay
    for (let i = this.sliceTrail.length - 1; i >= 0; i--) {
      this.sliceTrail[i].life -= 0.08;
      if (this.sliceTrail[i].life <= 0) {
        this.sliceTrail.splice(i, 1);
      }
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    // Background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`SLICED: ${this.slicedCount} / ${this.targetSlices}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Slice Blade Trail
    if (this.sliceTrail.length > 1) {
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(this.sliceTrail[0].x, this.sliceTrail[0].y);
      for (let i = 1; i < this.sliceTrail.length; i++) {
        this.ctx.lineTo(this.sliceTrail[i].x, this.sliceTrail[i].y);
      }
      this.ctx.stroke();
    }

    // Draw Fruits
    for (const f of this.fruits) {
      if (!f.sliced) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '36px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(f.type, f.x, f.y);
      } else {
        // Render Sliced half explosion effect
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '24px sans-serif';
        this.ctx.fillText('💥', f.x, f.y);
      }
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resize);
    this.removeControls();
  }
}
