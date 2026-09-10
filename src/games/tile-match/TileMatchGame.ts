import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Tile {
  id: number;
  type: string;
  x: number;
  y: number;
  z: number;
  size: number;
}

const TILE_ICONS = ['🍎', '🍌', '🍇', '🍒', '🍓', '🥑', '🍕', '🍔', '🍦', '🍩', '🏀', '⚽'];

export class TileMatchGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;

  private tiles: Tile[] = [];
  private tray: string[] = [];
  private TRAY_CAPACITY = 7;

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

    storageService.loadGameState('tile-match').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('tile-match');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.tray = [];

    const numTypes = Math.min(TILE_ICONS.length, 3 + Math.floor(lvl / 5));
    const activeIcons = TILE_ICONS.slice(0, numTypes);
    const tripletsCount = Math.min(15, 2 + Math.floor(lvl / 3));

    const tilePool: string[] = [];
    for (let i = 0; i < tripletsCount; i++) {
      const type = activeIcons[i % activeIcons.length];
      tilePool.push(type, type, type);
    }

    // Shuffle pool
    for (let i = tilePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
    }

    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const tileSize = Math.min(60, (width - 40) / 5);
    const startX = (width - 4 * tileSize) / 2;
    const startY = height * 0.2;

    this.tiles = tilePool.map((type, idx) => {
      const layer = Math.floor(idx / 12);
      const posInLayer = idx % 12;
      const col = posInLayer % 4;
      const row = Math.floor(posInLayer / 4);

      return {
        id: idx,
        type,
        x: startX + col * tileSize + (layer * 10),
        y: startY + row * tileSize + (layer * 10),
        z: layer,
        size: tileSize
      };
    });

    // Sort by layer for proper rendering & hit testing
    this.tiles.sort((a, b) => a.z - b.z);
  }

  private setupControls() {
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private removeControls() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left);
    const clickY = (e.clientY - rect.top);

    // Find clicked tile (topmost layer z)
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      const t = this.tiles[i];
      if (
        clickX >= t.x &&
        clickX <= t.x + t.size &&
        clickY >= t.y &&
        clickY <= t.y + t.size
      ) {
        if (!this.isTileCovered(t)) {
          this.pickTile(i);
          break;
        }
      }
    }
  };

  private isTileCovered(target: Tile): boolean {
    for (const t of this.tiles) {
      if (t.z > target.z) {
        const overlapX = Math.abs(t.x - target.x) < target.size * 0.8;
        const overlapY = Math.abs(t.y - target.y) < target.size * 0.8;
        if (overlapX && overlapY) return true;
      }
    }
    return false;
  }

  private pickTile(index: number) {
    const tile = this.tiles.splice(index, 1)[0];
    this.tray.push(tile.type);
    storageService.triggerHaptic('light');
    audioService.playSfx('pop');

    // Check match 3 in tray
    const counts: Record<string, number> = {};
    this.tray.forEach(t => counts[t] = (counts[t] || 0) + 1);

    for (const type in counts) {
      if (counts[type] >= 3) {
        this.tray = this.tray.filter(t => t !== type);
        this.score += 150;
        this.onScoreUpdate(this.score);
        storageService.triggerHaptic('medium');
        audioService.playSfx('powerup');
        break;
      }
    }

    // Check Win
    if (this.tiles.length === 0 && this.tray.length === 0) {
      if (this.level < 100) {
        this.level++;
        storageService.saveGameState('tile-match', {
          unlockedLevels: this.level,
          highScore: this.score
        });
        storageService.triggerHaptic('success');
        audioService.playSfx('win');
        this.setupLevel(this.level);
      }
      return;
    }

    // Check Tray Full Game Over
    if (this.tray.length >= this.TRAY_CAPACITY) {
      this.isRunning = false;
      storageService.triggerHaptic('error');
      audioService.playSfx('gameover');
      this.onGameOver(this.score);
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
      this.render();
    }
    this.animId = requestAnimationFrame(this.loop);
  };

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
    this.ctx.fillText(`TILES REMAINING: ${this.tiles.length}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Render Board Tiles
    for (const t of this.tiles) {
      const isCovered = this.isTileCovered(t);

      this.ctx.fillStyle = isCovered ? '#334155' : '#1e293b';
      this.roundRect(t.x, t.y, t.size, t.size, 10);
      this.ctx.fill();

      this.ctx.strokeStyle = isCovered ? '#475569' : '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = isCovered ? '#64748b' : '#ffffff';
      this.ctx.font = '28px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(t.type, t.x + t.size / 2, t.y + t.size / 2);
    }

    // Render Tray Container at Bottom
    const trayY = height - 100;
    const slotSize = Math.min(50, (width - 40) / 7);
    const trayWidth = slotSize * 7 + 16;
    const trayX = (width - trayWidth) / 2;

    this.ctx.fillStyle = '#1e293b';
    this.roundRect(trayX, trayY, trayWidth, slotSize + 16, 14);
    this.ctx.fill();
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Render Tiles inside Tray
    for (let i = 0; i < this.TRAY_CAPACITY; i++) {
      const sx = trayX + 8 + i * slotSize;
      const sy = trayY + 8;

      this.ctx.fillStyle = '#0f172a';
      this.roundRect(sx, sy, slotSize - 4, slotSize, 8);
      this.ctx.fill();

      if (i < this.tray.length) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.tray[i], sx + (slotSize - 4) / 2, sy + slotSize / 2);
      }
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
