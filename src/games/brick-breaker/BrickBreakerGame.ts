import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export class BrickBreakerGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private lives = 3;

  private paddle = { x: 0, width: 90, height: 14 };
  private balls: Ball[] = [];
  private bricks: Brick[] = [];

  private BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6'];

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

    storageService.loadGameState('brick-breaker').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('brick-breaker');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.lives = 3;

    const width = this.logicalWidth;

    this.paddle = {
      x: (width - 90) / 2,
      width: Math.max(60, 100 - lvl),
      height: 14
    };

    this.resetBall();

    // Setup bricks
    const rows = Math.min(8, 3 + Math.floor(lvl / 5));
    const cols = 6;
    const brickWidth = (width - 40) / cols;
    const brickHeight = 22;

    this.bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = (lvl > 10 && r === 0) ? 2 : 1;
        this.bricks.push({
          x: 20 + c * brickWidth,
          y: 70 + r * (brickHeight + 6),
          width: brickWidth - 4,
          height: brickHeight,
          hp,
          maxHp: hp,
          color: this.BRICK_COLORS[r % this.BRICK_COLORS.length]
        });
      }
    }
  }

  private resetBall() {
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    this.balls = [
      {
        x: width / 2,
        y: height - 100,
        vx: (Math.random() < 0.5 ? 1 : -1) * (4 + this.level * 0.1),
        vy: -(5 + this.level * 0.1),
        radius: 8
      }
    ];
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
    }
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;
    const speed = 24;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      this.paddle.x = Math.max(0, this.paddle.x - speed);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      this.paddle.x = Math.min(this.logicalWidth - this.paddle.width, this.paddle.x + speed);
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    this.paddle.x = Math.max(0, Math.min(this.logicalWidth - this.paddle.width, touchX - this.paddle.width / 2));
  };

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
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const paddleY = height - 50;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.x += b.vx;
      b.y += b.vy;

      // Wall collisions
      if (b.x - b.radius <= 0) {
        b.x = b.radius;
        b.vx = -b.vx;
        audioService.playSfx('pop');
      } else if (b.x + b.radius >= width) {
        b.x = width - b.radius;
        b.vx = -b.vx;
        audioService.playSfx('pop');
      }

      if (b.y - b.radius <= 0) {
        b.y = b.radius;
        b.vy = -b.vy;
        audioService.playSfx('pop');
      }

      // Paddle collision
      if (
        b.y + b.radius >= paddleY &&
        b.y - b.radius <= paddleY + this.paddle.height &&
        b.x >= this.paddle.x &&
        b.x <= this.paddle.x + this.paddle.width
      ) {
        b.vy = -Math.abs(b.vy);
        const hitPos = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        b.vx = hitPos * 7;
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
      }

      // Brick collisions
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const br = this.bricks[j];
        if (
          b.x + b.radius >= br.x &&
          b.x - b.radius <= br.x + br.width &&
          b.y + b.radius >= br.y &&
          b.y - b.radius <= br.y + br.height
        ) {
          b.vy = -b.vy;
          br.hp--;
          if (br.hp <= 0) {
            this.bricks.splice(j, 1);
            this.score += 100;
            this.onScoreUpdate(this.score);
            storageService.triggerHaptic('medium');
            audioService.playSfx('powerup');
          }
          break;
        }
      }

      // Ball out of bounds bottom
      if (b.y - b.radius > height) {
        this.balls.splice(i, 1);
      }
    }

    // Check lost life
    if (this.balls.length === 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.isRunning = false;
        storageService.triggerHaptic('error');
        audioService.playSfx('gameover');
        this.onGameOver(this.score);
      } else {
        this.resetBall();
      }
    }

    // Check level complete
    if (this.bricks.length === 0) {
      if (this.level < 100) {
        this.level++;
        storageService.saveGameState('brick-breaker', {
          unlockedLevels: this.level,
          highScore: this.score
        });
        storageService.triggerHaptic('success');
        audioService.playSfx('win');
        this.setupLevel(this.level);
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

    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = '600 14px sans-serif';
    this.ctx.fillText(`LIVES: ${'❤️'.repeat(this.lives)}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Bricks
    for (const br of this.bricks) {
      this.ctx.fillStyle = br.color;
      this.ctx.fillRect(br.x, br.y, br.width, br.height);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(br.x, br.y, br.width, br.height);
    }

    // Draw Paddle
    const paddleY = height - 50;
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(this.paddle.x, paddleY, this.paddle.width, this.paddle.height);

    // Draw Balls
    for (const b of this.balls) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
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
