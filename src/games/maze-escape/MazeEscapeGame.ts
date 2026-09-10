import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Cell {
  r: number;
  c: number;
  walls: [boolean, boolean, boolean, boolean]; // top, right, bottom, left
  visited: boolean;
}

export class MazeEscapeGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;

  private gridRows = 6;
  private gridCols = 6;
  private grid: Cell[][] = [];

  private playerPos = { r: 0, c: 0 };
  private exitPos = { r: 5, c: 5 };
  private energy = 100;

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

    storageService.loadGameState('maze-escape').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('maze-escape');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.energy = 100;

    const size = Math.min(20, 6 + Math.floor(lvl / 5));
    this.gridRows = size;
    this.gridCols = size;

    this.generateMaze();

    this.playerPos = { r: 0, c: 0 };
    this.exitPos = { r: this.gridRows - 1, c: this.gridCols - 1 };
  }

  private generateMaze() {
    this.grid = [];
    for (let r = 0; r < this.gridRows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.gridCols; c++) {
        row.push({ r, c, walls: [true, true, true, true], visited: false });
      }
      this.grid.push(row);
    }

    // Depth First Search Maze Generator
    const stack: Cell[] = [];
    const current = this.grid[0][0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
      const curr = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(curr);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWalls(curr, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }
  }

  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const { r, c } = cell;
    const res: Cell[] = [];
    if (r > 0 && !this.grid[r - 1][c].visited) res.push(this.grid[r - 1][c]);
    if (c < this.gridCols - 1 && !this.grid[r][c + 1].visited) res.push(this.grid[r][c + 1]);
    if (r < this.gridRows - 1 && !this.grid[r + 1][c].visited) res.push(this.grid[r + 1][c]);
    if (c > 0 && !this.grid[r][c - 1].visited) res.push(this.grid[r][c - 1]);
    return res;
  }

  private removeWalls(a: Cell, b: Cell) {
    const dr = a.r - b.r;
    const dc = a.c - b.c;

    if (dr === 1) { a.walls[0] = false; b.walls[2] = false; }
    else if (dr === -1) { a.walls[2] = false; b.walls[0] = false; }

    if (dc === 1) { a.walls[3] = false; b.walls[1] = false; }
    else if (dc === -1) { a.walls[1] = false; b.walls[3] = false; }
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;

    if (e.key === 'ArrowUp' || e.key === 'w') this.movePlayer(0);
    else if (e.key === 'ArrowRight' || e.key === 'd') this.movePlayer(1);
    else if (e.key === 'ArrowDown' || e.key === 's') this.movePlayer(2);
    else if (e.key === 'ArrowLeft' || e.key === 'a') this.movePlayer(3);
  };

  private movePlayer(dir: 0 | 1 | 2 | 3) {
    const { r, c } = this.playerPos;
    const cell = this.grid[r][c];

    if (!cell.walls[dir]) {
      if (dir === 0) this.playerPos.r--;
      else if (dir === 1) this.playerPos.c++;
      else if (dir === 2) this.playerPos.r++;
      else if (dir === 3) this.playerPos.c--;

      storageService.triggerHaptic('light');
      audioService.playSfx('pop');

      // Check Win
      if (this.playerPos.r === this.exitPos.r && this.playerPos.c === this.exitPos.c) {
        this.score += Math.floor(this.energy * 10) + 500;
        this.onScoreUpdate(this.score);

        if (this.level < 100) {
          this.level++;
          storageService.saveGameState('maze-escape', {
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
    this.energy -= 0.05;
    if (this.energy <= 0) {
      this.isRunning = false;
      storageService.triggerHaptic('error');
      audioService.playSfx('gameover');
      this.onGameOver(this.score);
    }
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

    this.ctx.fillStyle = '#eab308';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`ENERGY: ${Math.max(0, Math.floor(this.energy))}%`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Render Maze Grid
    const mazeSize = Math.min(width - 40, height - 160);
    const startX = (width - mazeSize) / 2;
    const startY = (height - mazeSize) / 2 + 20;

    const cellSize = mazeSize / this.gridCols;

    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 3;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.grid[r][c];
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;

        if (cell.walls[0]) {
          this.ctx.beginPath(); this.ctx.moveTo(x, y); this.ctx.lineTo(x + cellSize, y); this.ctx.stroke();
        }
        if (cell.walls[1]) {
          this.ctx.beginPath(); this.ctx.moveTo(x + cellSize, y); this.ctx.lineTo(x + cellSize, y + cellSize); this.ctx.stroke();
        }
        if (cell.walls[2]) {
          this.ctx.beginPath(); this.ctx.moveTo(x + cellSize, y + cellSize); this.ctx.lineTo(x, y + cellSize); this.ctx.stroke();
        }
        if (cell.walls[3]) {
          this.ctx.beginPath(); this.ctx.moveTo(x, y + cellSize); this.ctx.lineTo(x, y); this.ctx.stroke();
        }
      }
    }

    // Draw Exit Portal
    const exitX = startX + this.exitPos.c * cellSize + cellSize / 2;
    const exitY = startY + this.exitPos.r * cellSize + cellSize / 2;
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.arc(exitX, exitY, cellSize * 0.35, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw Player Orb
    const px = startX + this.playerPos.c * cellSize + cellSize / 2;
    const py = startY + this.playerPos.r * cellSize + cellSize / 2;
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.beginPath();
    this.ctx.arc(px, py, cellSize * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
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
