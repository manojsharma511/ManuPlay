import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

const COLORS = ['#00f0ff', '#f59e0b', '#ec4899', '#84cc16'];

interface Obstacle {
  y: number;
  radius: number;
  rotation: number;
  speed: number;
  type: 'circle' | 'square';
}

export class ColorSwitchGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;

  private ball = { y: 0, vy: 0, color: COLORS[0], radius: 10 };
  private gravity = 0.45;
  private bouncePower = -8.5;
  private cameraY = 0;

  private obstacles: Obstacle[] = [];
  private targetStars = 5;

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

    storageService.loadGameState('color-switch').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('color-switch');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.targetStars = 3 + Math.floor(lvl / 3);

    const height = this.logicalHeight;
    this.ball = {
      y: height - 120,
      vy: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      radius: 10
    };
    this.cameraY = 0;

    this.obstacles = [];
    const count = this.targetStars + 2;
    const spacing = 220;

    for (let i = 0; i < count; i++) {
      this.obstacles.push({
        y: height - 300 - i * spacing,
        radius: 75,
        rotation: 0,
        speed: (0.02 + Math.min(0.04, lvl * 0.001)) * (i % 2 === 0 ? 1 : -1),
        type: i % 2 === 0 ? 'circle' : 'square'
      });
    }
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      this.bounce();
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.bounce();
  };

  private bounce() {
    if (!this.isRunning || this.isPaused) return;
    this.ball.vy = this.bouncePower;
    storageService.triggerHaptic('light');
    audioService.playSfx('pop');
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
    // Ball physics
    this.ball.vy += this.gravity;
    this.ball.y += this.ball.vy;

    // Smooth camera scroll
    const targetCamY = Math.max(0, this.logicalHeight / 2 - this.ball.y);
    if (targetCamY > this.cameraY) {
      this.cameraY += (targetCamY - this.cameraY) * 0.1;
    }

    // Floor collision / death
    if (this.ball.y - this.cameraY > this.logicalHeight + 50) {
      this.handleGameOver();
      return;
    }

    // Rotate obstacles & check collisions
    for (const obs of this.obstacles) {
      obs.rotation += obs.speed;

      // Ball distance to obstacle center
      const dist = Math.abs(this.ball.y - obs.y);
      if (dist < obs.radius + 12 && dist > obs.radius - 12) {
        // Calculate segment angle
        const angle = (obs.rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const segmentIdx = Math.floor((angle / (Math.PI * 2)) * 4) % 4;
        const obstacleColor = COLORS[segmentIdx];

        if (obstacleColor !== this.ball.color) {
          // Color mismatch! Game Over
          this.handleGameOver();
          return;
        } else {
          // Passed obstacle safely!
          this.score += 50;
          this.onScoreUpdate(this.score);
        }
      }
    }

    // Check level completion
    if (this.ball.y < this.obstacles[this.obstacles.length - 1].y - 100) {
      if (this.level < 100) {
        this.level++;
        storageService.saveGameState('color-switch', {
          unlockedLevels: this.level,
          highScore: this.score
        });
        storageService.triggerHaptic('success');
        audioService.playSfx('win');
        this.setupLevel(this.level);
      }
    }
  }

  private handleGameOver() {
    this.isRunning = false;
    storageService.triggerHaptic('error');
    audioService.playSfx('gameover');
    this.onGameOver(this.score);
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    // Background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    const centerX = width / 2;

    // Draw Obstacles
    for (const obs of this.obstacles) {
      this.ctx.save();
      this.ctx.translate(centerX, obs.y);
      this.ctx.rotate(obs.rotation);

      const arc = (Math.PI * 2) / 4;
      for (let i = 0; i < 4; i++) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, obs.radius, i * arc, (i + 1) * arc);
        this.ctx.strokeStyle = COLORS[i];
        this.ctx.lineWidth = 14;
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // Draw Ball
    this.ctx.fillStyle = this.ball.color;
    this.ctx.beginPath();
    this.ctx.arc(centerX, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
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
