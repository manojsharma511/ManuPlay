import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export class StackTowerGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private targetBlocks = 20;

  private stack: Block[] = [];
  private currentBlock: { x: number; y: number; width: number; speed: number; direction: number; color: string } | null = null;
  private cameraY = 0;
  private perfectCombo = 0;

  private COLORS = ['#00f0ff', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#10b981'];

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

    storageService.loadGameState('stack-tower').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('stack-tower');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.perfectCombo = 0;
    this.targetBlocks = 15 + lvl * 2;

    const baseWidth = Math.max(80, 200 - lvl * 2);
    const baseHeight = 24;

    this.stack = [
      {
        x: (this.logicalWidth - baseWidth) / 2,
        y: this.logicalHeight - 80,
        width: baseWidth,
        height: baseHeight,
        color: '#334155'
      }
    ];

    this.cameraY = 0;
    this.spawnNextBlock();
  }

  private spawnNextBlock() {
    const prevBlock = this.stack[this.stack.length - 1];
    const speed = Math.min(12, 3 + this.level * 0.15 + (this.stack.length * 0.1));
    const colorIndex = (this.stack.length - 1) % this.COLORS.length;

    this.currentBlock = {
      x: 0,
      y: prevBlock.y - 24,
      width: prevBlock.width,
      speed,
      direction: Math.random() < 0.5 ? 1 : -1,
      color: this.COLORS[colorIndex]
    };
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
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      e.preventDefault();
      this.dropBlock();
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.dropBlock();
  };

  private dropBlock() {
    if (!this.isRunning || this.isPaused || !this.currentBlock) return;

    const prevBlock = this.stack[this.stack.length - 1];
    const curr = this.currentBlock;

    const deltaX = curr.x - prevBlock.x;
    const tolerance = 4;

    if (Math.abs(deltaX) <= tolerance) {
      // Perfect drop!
      this.perfectCombo++;
      this.score += 50 * this.perfectCombo;
      curr.x = prevBlock.x;
      storageService.triggerHaptic('heavy');
      audioService.playSfx('powerup');
    } else if (Math.abs(deltaX) >= curr.width) {
      // Game Over! Missed stack
      this.handleGameOver();
      return;
    } else {
      // Trim block
      this.perfectCombo = 0;
      const overlapWidth = curr.width - Math.abs(deltaX);
      if (deltaX > 0) {
        curr.x = prevBlock.x + deltaX;
      } else {
        curr.x = prevBlock.x;
      }
      curr.width = overlapWidth;
      this.score += 10;
      storageService.triggerHaptic('light');
      audioService.playSfx('pop');
    }

    this.stack.push({
      x: curr.x,
      y: curr.y,
      width: curr.width,
      height: 24,
      color: curr.color
    });

    this.onScoreUpdate(this.score);

    // Check level completion
    if (this.stack.length >= this.targetBlocks) {
      this.levelComplete();
      return;
    }

    // Scroll camera up
    if (this.stack.length > 6) {
      this.cameraY += 24;
    }

    this.spawnNextBlock();
  }

  private levelComplete() {
    if (this.level < 100) {
      this.level++;
      storageService.saveGameState('stack-tower', {
        unlockedLevels: this.level,
        highScore: this.score
      });
      storageService.triggerHaptic('success');
      audioService.playSfx('win');
      this.setupLevel(this.level);
    }
  }

  private handleGameOver() {
    this.isRunning = false;
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
    if (!this.currentBlock) return;
    this.currentBlock.x += this.currentBlock.speed * this.currentBlock.direction;

    const width = this.logicalWidth;
    if (this.currentBlock.x <= 0) {
      this.currentBlock.x = 0;
      this.currentBlock.direction = 1;
    } else if (this.currentBlock.x + this.currentBlock.width >= width) {
      this.currentBlock.x = width - this.currentBlock.width;
      this.currentBlock.direction = -1;
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    // Background gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`STACK: ${this.stack.length} / ${this.targetBlocks}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    if (this.perfectCombo > 1) {
      this.ctx.fillStyle = '#ec4899';
      this.ctx.font = '900 16px sans-serif';
      this.ctx.fillText(`PERFECT x${this.perfectCombo}!`, width - 20, 55);
    }

    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    // Draw Stacked Blocks
    this.stack.forEach((b) => {
      this.ctx!.fillStyle = b.color;
      this.ctx!.fillRect(b.x, b.y, b.width, b.height);
      this.ctx!.strokeStyle = 'rgba(255,255,255,0.2)';
      this.ctx!.lineWidth = 2;
      this.ctx!.strokeRect(b.x, b.y, b.width, b.height);
    });

    // Draw Current Moving Block
    if (this.currentBlock) {
      this.ctx.fillStyle = this.currentBlock.color;
      this.ctx.fillRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.width, 24);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.width, 24);
    }

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
