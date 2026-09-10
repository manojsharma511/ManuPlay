import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

export class NumberMergeGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private targetTile = 256;
  private gridSize = 4;
  private grid: number[][] = [];
  private moveCount = 0;

  private touchStartX = 0;
  private touchStartY = 0;

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

    // Load saved unlocked level if available
    storageService.loadGameState('number-merge').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('number-merge');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.gridSize = lvl > 50 ? 5 : (lvl < 10 ? 4 : 4);
    this.targetTile = Math.min(16384, 128 * Math.pow(2, Math.floor((lvl - 1) / 5)));

    this.grid = Array(this.gridSize).fill(0).map(() => Array(this.gridSize).fill(0));
    this.addRandomTile();
    this.addRandomTile();

    // Place obstacle blocks on level > 15
    if (lvl > 15 && this.gridSize >= 4) {
      const obstacles = Math.min(3, Math.floor((lvl - 10) / 10));
      for (let i = 0; i < obstacles; i++) {
        const r = Math.floor(Math.random() * this.gridSize);
        const c = Math.floor(Math.random() * this.gridSize);
        if (this.grid[r][c] === 0) {
          this.grid[r][c] = -1; // -1 represents a locked block
        }
      }
    }
  }

  private addRandomTile() {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.85 ? 2 : 4;
    }
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);

    if (this.canvas) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;
    let moved = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') moved = this.move('left');
    else if (e.key === 'ArrowRight' || e.key === 'd') moved = this.move('right');
    else if (e.key === 'ArrowUp' || e.key === 'w') moved = this.move('up');
    else if (e.key === 'ArrowDown' || e.key === 's') moved = this.move('down');

    if (moved) this.afterMove();
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.isRunning || this.isPaused || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    let moved = false;
    if (Math.abs(dx) > Math.abs(dy)) {
      moved = dx > 0 ? this.move('right') : this.move('left');
    } else {
      moved = dy > 0 ? this.move('down') : this.move('up');
    }

    if (moved) this.afterMove();
  };

  private move(direction: 'left' | 'right' | 'up' | 'down'): boolean {
    let moved = false;

    const rotate = (matrix: number[][]): number[][] => {
      const N = matrix.length;
      const res = Array(N).fill(0).map(() => Array(N).fill(0));
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          res[c][N - 1 - r] = matrix[r][c];
        }
      }
      return res;
    };

    let tempGrid = JSON.parse(JSON.stringify(this.grid));
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) tempGrid = rotate(tempGrid);

    // Slide left
    for (let r = 0; r < this.gridSize; r++) {
      let row = tempGrid[r].filter((v: number) => v !== 0);
      let newRow: number[] = [];
      let i = 0;
      while (i < row.length) {
        if (row[i] === -1) {
          newRow.push(-1);
          i++;
        } else if (i + 1 < row.length && row[i] === row[i + 1] && row[i] > 0) {
          const merged = row[i] * 2;
          newRow.push(merged);
          this.score += merged;
          if (merged >= this.targetTile) {
            this.checkLevelComplete();
          }
          i += 2;
        } else {
          newRow.push(row[i]);
          i++;
        }
      }
      while (newRow.length < this.gridSize) newRow.push(0);

      if (JSON.stringify(tempGrid[r]) !== JSON.stringify(newRow)) {
        moved = true;
      }
      tempGrid[r] = newRow;
    }

    // Rotate back
    for (let i = 0; i < (4 - rotations) % 4; i++) tempGrid = rotate(tempGrid);

    if (moved) {
      this.grid = tempGrid;
    }
    return moved;
  }

  private afterMove() {
    this.moveCount++;
    this.addRandomTile();
    this.onScoreUpdate(this.score);
    storageService.triggerHaptic('light');
    audioService.playSfx('pop');

    if (this.checkGameOver()) {
      this.isRunning = false;
      audioService.playSfx('gameover');
      this.onGameOver(this.score);
    }
  }

  private checkLevelComplete() {
    if (this.level < 100) {
      this.level++;
      storageService.saveGameState('number-merge', {
        unlockedLevels: this.level,
        highScore: this.score
      });
      storageService.triggerHaptic('success');
      audioService.playSfx('win');
    }
  }

  private checkGameOver(): boolean {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) return false;
        if (c + 1 < this.gridSize && this.grid[r][c] > 0 && this.grid[r][c] === this.grid[r][c + 1]) return false;
        if (r + 1 < this.gridSize && this.grid[r][c] > 0 && this.grid[r][c] === this.grid[r + 1][c]) return false;
      }
    }
    return true;
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
      this.render();
    }
    this.animId = requestAnimationFrame(this.loop);
  };

  private render() {
    if (!this.ctx || !this.canvas) return;
    const width = parseFloat(this.canvas.style.width) || this.canvas.width;
    const height = parseFloat(this.canvas.style.height) || this.canvas.height;

    // Background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // Header Info
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`TARGET: ${this.targetTile}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Board Area
    const boardSize = Math.min(width - 40, height - 140);
    const startX = (width - boardSize) / 2;
    const startY = (height - boardSize) / 2 + 20;

    // Draw board outer container
    this.ctx.fillStyle = '#1e293b';
    this.roundRect(startX - 10, startY - 10, boardSize + 20, boardSize + 20, 16);
    this.ctx.fill();

    const tileSize = (boardSize - (this.gridSize + 1) * 10) / this.gridSize;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const val = this.grid[r][c];
        const x = startX + 10 + c * (tileSize + 10);
        const y = startY + 10 + r * (tileSize + 10);

        this.ctx.fillStyle = this.getTileColor(val);
        this.roundRect(x, y, tileSize, tileSize, 12);
        this.ctx.fill();

        if (val !== 0) {
          this.ctx.fillStyle = val === -1 ? '#ef4444' : (val > 4 ? '#ffffff' : '#0f172a');
          this.ctx.font = `900 ${tileSize > 60 ? '22px' : '16px'} sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(val === -1 ? '🔒' : val.toString(), x + tileSize / 2, y + tileSize / 2);
        }
      }
    }
  }

  private getTileColor(val: number): string {
    switch (val) {
      case 0: return '#334155';
      case -1: return '#475569';
      case 2: return '#e2e8f0';
      case 4: return '#fef08a';
      case 8: return '#fdba74';
      case 16: return '#f97316';
      case 32: return '#ef4444';
      case 64: return '#dc2626';
      case 128: return '#eab308';
      case 256: return '#84cc16';
      case 512: return '#10b981';
      case 1024: return '#06b6d4';
      case 2048: return '#3b82f6';
      case 4096: return '#8b5cf6';
      case 8192: return '#ec4899';
      default: return '#f43f5e';
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
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
