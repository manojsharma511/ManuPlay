import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface BlockShape {
  id: number;
  matrix: number[][];
  color: string;
  width: number;
  height: number;
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
    this.grid = Array(8).fill(null).map(() => Array(8).fill(''));
    this.score = 0;
    this.isRunning = true;
    this.isPaused = false;

    this.generateNewShapes();
    this.setupTouchEvents();

    audioService.startSynthMusic('puzzle');
    this.loop();
  }

  private resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 400;
      this.canvas.height = parent.clientHeight || 650;
    }
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

  private setupTouchEvents() {
    if (!this.canvas) return;
    
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!this.canvas || !this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.touchX = clientX - rect.left;
      this.touchY = clientY - rect.top;

      // Check shape selection
      const shapeContainerY = this.canvas.height - 120;
      if (this.touchY > shapeContainerY) {
        const slotW = this.canvas.width / 3;
        const slotIdx = Math.floor(this.touchX / slotW);
        if (this.currentShapes[slotIdx]) {
          this.selectedShapeIndex = slotIdx;
          audioService.playClick();
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (this.selectedShapeIndex === null || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.touchX = clientX - rect.left;
      this.touchY = clientY - rect.top;
    };

    const handleEnd = () => {
      if (this.selectedShapeIndex === null || !this.canvas) return;
      const shape = this.currentShapes[this.selectedShapeIndex];
      if (shape) {
        const cellSize = (this.canvas.width - 40) / 8;
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

    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', handleStart);
    this.canvas.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
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

    // Check rows
    for (let r = 0; r < 8; r++) {
      if (this.grid[r].every(cell => cell !== '')) rowsToClear.push(r);
    }
    // Check cols
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

      rowsToClear.forEach(r => {
        for (let c = 0; c < 8; c++) this.grid[r][c] = '';
      });
      colsToClear.forEach(c => {
        for (let r = 0; r < 8; r++) this.grid[r][c] = '';
      });

      const totalLines = rowsToClear.length + colsToClear.length;
      this.score += totalLines * 100 * totalLines; // Combo multiplier
      this.onScoreUpdate(this.score);
    }
  }

  private checkGameOver(): boolean {
    const availableShapes = this.currentShapes.filter((s): s is BlockShape => s !== null);
    if (availableShapes.length === 0) return false;

    for (const shape of availableShapes) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.canPlaceShape(shape, c, r)) {
            return false; // Valid placement exists
          }
        }
      }
    }
    return true; // No available placements -> Game Over!
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
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

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
