import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Tube {
  id: number;
  capacity: number;
  colors: string[];
}

export class ColorSortGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private level = 1;
  private score = 0;
  private tubes: Tube[] = [];
  private selectedTubeIndex: number | null = null;
  private moves = 0;

  private COLOR_PALETTE = ['#ff0055', '#00f0ff', '#ffaa00', '#00ff88', '#9900ff', '#ff007f'];

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

    this.level = 1;
    this.score = 0;
    this.moves = 0;

    this.isRunning = true;
    this.isPaused = false;

    this.setupLevel(this.level);
    this.setupTouch();

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('color-sort');
    this.loop();
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

      if (this.ctx) {
        this.ctx.scale(dpr, dpr);
      }
    }
  };

  private get logicalWidth(): number {
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 400;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 700;
  }

  private setupLevel(lvl: number) {
    const numColors = Math.min(6, 3 + Math.floor(lvl / 2));
    const activeColors = this.COLOR_PALETTE.slice(0, numColors);

    // Create 4 items per color
    const pool: string[] = [];
    activeColors.forEach(c => {
      for (let k = 0; k < 4; k++) pool.push(c);
    });

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.tubes = [];
    // Filled tubes
    for (let t = 0; t < numColors; t++) {
      this.tubes.push({
        id: t,
        capacity: 4,
        colors: pool.slice(t * 4, t * 4 + 4)
      });
    }

    // Two empty tubes for sorting
    this.tubes.push({ id: numColors, capacity: 4, colors: [] });
    this.tubes.push({ id: numColors + 1, capacity: 4, colors: [] });

    this.selectedTubeIndex = null;
  }

  private handleTubeClick = (e: MouseEvent | TouchEvent) => {
    if (!this.canvas || !this.isRunning || this.isPaused) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const totalTubes = this.tubes.length;
    const cols = totalTubes <= 4 ? totalTubes : Math.ceil(totalTubes / 2);
    const tubeW = 44;
    const tubeH = 140;

    for (let i = 0; i < totalTubes; i++) {
      const row = i < cols ? 0 : 1;
      const col = i < cols ? i : i - cols;
      const startX = (this.logicalWidth - cols * 65) / 2 + col * 65;
      const startY = row === 0 ? 180 : 360;

      if (clickX >= startX && clickX <= startX + tubeW && clickY >= startY - 20 && clickY <= startY + tubeH + 20) {
        if (this.selectedTubeIndex === null) {
          if (this.tubes[i].colors.length > 0) {
            this.selectedTubeIndex = i;
            audioService.playClick();
            storageService.triggerHaptic('light');
          }
        } else if (this.selectedTubeIndex === i) {
          this.selectedTubeIndex = null;
        } else {
          this.transferColor(this.selectedTubeIndex, i);
          this.selectedTubeIndex = null;
        }
        break;
      }
    }
  };

  private setupTouch() {
    if (!this.canvas) return;
    this.canvas.addEventListener('click', this.handleTubeClick);
    this.canvas.addEventListener('touchstart', this.handleTubeClick, { passive: true });
  }

  private transferColor(fromIdx: number, toIdx: number) {
    const fromTube = this.tubes[fromIdx];
    const toTube = this.tubes[toIdx];

    if (fromTube.colors.length === 0 || toTube.colors.length >= toTube.capacity) return;

    const colorToMove = fromTube.colors[fromTube.colors.length - 1];

    if (toTube.colors.length === 0 || toTube.colors[toTube.colors.length - 1] === colorToMove) {
      fromTube.colors.pop();
      toTube.colors.push(colorToMove);
      this.moves++;

      audioService.playJump();
      storageService.triggerHaptic('light');

      this.checkWinCondition();
    }
  }

  private checkWinCondition() {
    const isSolved = this.tubes.every(t => {
      if (t.colors.length === 0) return true;
      if (t.colors.length !== t.capacity) return false;
      return t.colors.every(c => c === t.colors[0]);
    });

    if (isSolved) {
      audioService.playCoin();
      storageService.triggerHaptic('success');

      this.score += 500 + Math.max(0, 300 - this.moves * 10);
      this.onScoreUpdate(this.score);

      this.level++;
      setTimeout(() => {
        if (this.level > 10) {
          audioService.playGameOver();
          ManuPlayGameSDK.gameCompleted('color-sort', this.score);
          this.destroy();
          this.onGameOver(this.score);
        } else {
          this.setupLevel(this.level);
        }
      }, 500);
    }
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
      this.canvas.removeEventListener('click', this.handleTubeClick);
      this.canvas.removeEventListener('touchstart', this.handleTubeClick);
    }
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

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

    // Render Tubes & Colors
    const totalTubes = this.tubes.length;
    const cols = totalTubes <= 4 ? totalTubes : Math.ceil(totalTubes / 2);
    const tubeW = 44;
    const tubeH = 140;
    const blockH = 30;

    this.tubes.forEach((tube, i) => {
      const row = i < cols ? 0 : 1;
      const col = i < cols ? i : i - cols;
      const x = (w - cols * 65) / 2 + col * 65;
      const y = row === 0 ? 180 : 360;
      const isSelected = this.selectedTubeIndex === i;

      ctx.save();
      if (isSelected) {
        ctx.translate(0, -15);
      }

      // Draw Glass Tube outline
      ctx.strokeStyle = isSelected ? '#00f0ff' : '#282e4a';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#121524';

      ctx.beginPath();
      ctx.roundRect(x, y, tubeW, tubeH, [0, 0, 16, 16]);
      ctx.fill();
      ctx.stroke();

      // Draw Liquid Colors
      tube.colors.forEach((color, idx) => {
        const blockY = y + tubeH - (idx + 1) * (blockH + 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.roundRect(x + 4, blockY, tubeW - 8, blockH, 4);
        ctx.fill();
      });

      ctx.restore();
    });

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`🧪 LEVEL: ${this.level}/10   🎯 MOVES: ${this.moves}`, 20, 40);
    ctx.restore();
  }
}
