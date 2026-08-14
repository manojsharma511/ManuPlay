import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface BlockShape {
  id: number;
  matrix: number[][];
  color: string;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const SHAPES: Array<{ matrix: number[][]; color: string }> = [
  { matrix: [[1, 1], [1, 1]], color: '#00f0ff' }, // 2x2 Square
  { matrix: [[1, 1, 1]], color: '#ff007f' },     // 3x1 Line
  { matrix: [[1], [1], [1]], color: '#ff007f' }, // 1x3 Line
  { matrix: [[1, 1, 1, 1]], color: '#00ff88' },  // 4x1 Line
  { matrix: [[1], [1], [1], [1]], color: '#00ff88' }, // 1x4 Line
  { matrix: [[1, 0], [1, 0], [1, 1]], color: '#ffaa00' }, // L shape
  { matrix: [[1, 1, 1], [0, 1, 0]], color: '#9900ff' },   // T shape
  { matrix: [[1]], color: '#ffffff' }            // 1x1 Dot
];

export class BlockPuzzleGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Grid state
  private grid: string[][] = Array(8).fill(null).map(() => Array(8).fill(''));
  private currentShapes: (BlockShape | null)[] = [];
  private selectedShapeIndex: number | null = null;
  private touchX = 0;
  private touchY = 0;
  private particles: Particle[] = [];

  // Game state
  private score = 0;

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

    this.grid = Array(8).fill(null).map(() => Array(8).fill(''));
    this.score = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.particles = [];

    this.generateNewShapes();
    this.setupTouchEvents();

    audioService.startSynthMusic('puzzle');
    this.loop();
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 400;
      const height = parent.clientHeight || 650;

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
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 400;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 650;
  }

  private generateNewShapes() {
    this.currentShapes = [];
    for (let i = 0; i < 3; i++) {
      const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.currentShapes.push({
        id: Math.random(),
        matrix: template.matrix,
        color: template.color,
        width: template.matrix[0].length,
        height: template.matrix.length
      });
    }
  }

  private handleStart = (e: MouseEvent | TouchEvent) => {
    if (!this.canvas || !this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.touchX = clientX - rect.left;
    this.touchY = clientY - rect.top;

    const shapeContainerY = this.logicalHeight - 140;
    if (this.touchY > shapeContainerY) {
      const slotW = this.logicalWidth / 3;
      const slotIdx = Math.floor(this.touchX / slotW);
      if (this.currentShapes[slotIdx]) {
        this.selectedShapeIndex = slotIdx;
        audioService.playClick();
        storageService.triggerHaptic('light');
      }
    }
  };

  private handleMove = (e: MouseEvent | TouchEvent) => {
    if (this.selectedShapeIndex === null || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.touchX = clientX - rect.left;
    this.touchY = clientY - rect.top;
  };

  private handleEnd = () => {
    if (this.selectedShapeIndex === null || !this.canvas) return;
    const shape = this.currentShapes[this.selectedShapeIndex];
    if (shape) {
      const cellSize = (this.logicalWidth - 40) / 8;
      const gridX = Math.floor((this.touchX - 20) / cellSize);
      const gridY = Math.floor((this.touchY - 60) / cellSize);

      if (this.canPlaceShape(shape, gridX, gridY)) {
        this.placeShape(shape, gridX, gridY);
        this.currentShapes[this.selectedShapeIndex] = null;
        audioService.playJump();
        storageService.triggerHaptic('light');

        this.checkLineClears();

        if (this.currentShapes.every(s => s === null)) {
          this.generateNewShapes();
        }

        if (this.checkGameOver()) {
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }
    }
    this.selectedShapeIndex = null;
  };

  private setupTouchEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this.handleStart);
    this.canvas.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);

    this.canvas.addEventListener('touchstart', this.handleStart, { passive: true });
    this.canvas.addEventListener('touchmove', this.handleMove, { passive: true });
    window.addEventListener('touchend', this.handleEnd);
  }

  private canPlaceShape(shape: BlockShape, gx: number, gy: number): boolean {
    for (let r = 0; r < shape.height; r++) {
      for (let c = 0; c < shape.width; c++) {
        if (shape.matrix[r][c] === 1) {
          const targetX = gx + c;
          const targetY = gy + r;
          if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) return false;
          if (this.grid[targetY][targetX] !== '') return false;
        }
      }
    }
    return true;
  }

  private placeShape(shape: BlockShape, gx: number, gy: number) {
    let placedCount = 0;
    for (let r = 0; r < shape.height; r++) {
      for (let c = 0; c < shape.width; c++) {
        if (shape.matrix[r][c] === 1) {
          this.grid[gy + r][gx + c] = shape.color;
          placedCount++;
        }
      }
    }
    this.score += placedCount * 10;
    this.onScoreUpdate(this.score);
  }

  private checkLineClears() {
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < 8; r++) {
      if (this.grid[r].every(cell => cell !== '')) rowsToClear.push(r);
    }
    for (let c = 0; c < 8; c++) {
      let full = true;
      for (let r = 0; r < 8; r++) {
        if (this.grid[r][c] === '') { full = false; break; }
      }
      if (full) colsToClear.push(c);
    }

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
      audioService.playCoin();
      storageService.triggerHaptic('medium');

      const cellSize = (this.logicalWidth - 40) / 8;

      rowsToClear.forEach(r => {
        for (let c = 0; c < 8; c++) {
          this.createClearParticles(20 + c * cellSize + cellSize / 2, 60 + r * cellSize + cellSize / 2, this.grid[r][c] || '#00f0ff');
          this.grid[r][c] = '';
        }
      });
      colsToClear.forEach(c => {
        for (let r = 0; r < 8; r++) {
          if (this.grid[r][c] !== '') {
            this.createClearParticles(20 + c * cellSize + cellSize / 2, 60 + r * cellSize + cellSize / 2, this.grid[r][c]);
            this.grid[r][c] = '';
          }
        }
      });

      const totalLines = rowsToClear.length + colsToClear.length;
      this.score += totalLines * 100 * totalLines;
      this.onScoreUpdate(this.score);
    }
  }

  private createClearParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color,
        life: 0.5
      });
    }
  }

  private checkGameOver(): boolean {
    const availableShapes = this.currentShapes.filter((s): s is BlockShape => s !== null);
    if (availableShapes.length === 0) return false;

    for (const shape of availableShapes) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.canPlaceShape(shape, c, r)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    audioService.startSynthMusic('puzzle');
    this.loop();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleStart);
      this.canvas.removeEventListener('mousemove', this.handleMove);
      this.canvas.removeEventListener('touchstart', this.handleStart);
      this.canvas.removeEventListener('touchmove', this.handleMove);
    }
    window.removeEventListener('mouseup', this.handleEnd);
    window.removeEventListener('touchend', this.handleEnd);
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * 0.016;
      pt.y += pt.vy * 0.016;
      pt.life -= 0.016;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    const cellSize = (w - 40) / 8;
    const gridOriginX = 20;
    const gridOriginY = 60;

    // Render 8x8 Grid
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = gridOriginX + c * cellSize;
        const y = gridOriginY + r * cellSize;

        ctx.fillStyle = this.grid[r][c] || '#161926';
        ctx.strokeStyle = '#22273d';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Ghost Preview on Valid Grid Hover/Drag
    if (this.selectedShapeIndex !== null) {
      const shape = this.currentShapes[this.selectedShapeIndex];
      if (shape) {
        const gx = Math.floor((this.touchX - 20) / cellSize);
        const gy = Math.floor((this.touchY - 60) / cellSize);

        if (this.canPlaceShape(shape, gx, gy)) {
          ctx.save();
          ctx.fillStyle = `${shape.color}44`;
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 2;

          for (let r = 0; r < shape.height; r++) {
            for (let c = 0; c < shape.width; c++) {
              if (shape.matrix[r][c] === 1) {
                const px = gridOriginX + (gx + c) * cellSize;
                const py = gridOriginY + (gy + r) * cellSize;
                ctx.beginPath();
                ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 6);
                ctx.fill();
                ctx.stroke();
              }
            }
          }
          ctx.restore();
        }
      }
    }

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Shape Slots at bottom
    const shapeContainerY = h - 140;
    const slotW = w / 3;

    this.currentShapes.forEach((shape, idx) => {
      if (!shape || idx === this.selectedShapeIndex) return;
      const centerX = idx * slotW + slotW / 2;
      const centerY = shapeContainerY + 50;
      const miniCell = 16;

      ctx.fillStyle = shape.color;
      const startX = centerX - (shape.width * miniCell) / 2;
      const startY = centerY - (shape.height * miniCell) / 2;

      for (let r = 0; r < shape.height; r++) {
        for (let c = 0; c < shape.width; c++) {
          if (shape.matrix[r][c] === 1) {
            ctx.beginPath();
            ctx.roundRect(startX + c * miniCell, startY + r * miniCell, miniCell - 2, miniCell - 2, 3);
            ctx.fill();
          }
        }
      }
    });

    // Render Selected Dragged Shape
    if (this.selectedShapeIndex !== null) {
      const shape = this.currentShapes[this.selectedShapeIndex];
      if (shape) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = shape.color;
        ctx.fillStyle = shape.color;

        const startX = this.touchX - (shape.width * cellSize) / 2;
        const startY = this.touchY - (shape.height * cellSize) / 2;

        for (let r = 0; r < shape.height; r++) {
          for (let c = 0; c < shape.width; c++) {
            if (shape.matrix[r][c] === 1) {
              ctx.beginPath();
              ctx.roundRect(startX + c * cellSize, startY + r * cellSize, cellSize - 4, cellSize - 4, 6);
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }
    }
  }
}
