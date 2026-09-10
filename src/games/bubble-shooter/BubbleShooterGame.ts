import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Bubble {
  r: number;
  c: number;
  color: string;
  x: number;
  y: number;
}

const BUBBLE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export class BubbleShooterGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private ammoLeft = 30;

  private gridRows = 8;
  private gridCols = 8;
  private bubbleRadius = 20;
  private grid: (Bubble | null)[][] = [];

  private currentBubble: { color: string } = { color: BUBBLE_COLORS[0] };
  private nextBubble: { color: string } = { color: BUBBLE_COLORS[1] };
  private activeFlyingBubble: { x: number; y: number; vx: number; vy: number; color: string } | null = null;

  private aimAngle = -Math.PI / 2;

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

    storageService.loadGameState('bubble-shooter').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('bubble-shooter');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.ammoLeft = Math.max(15, 35 - Math.floor(lvl / 4));

    const numColors = Math.min(BUBBLE_COLORS.length, 3 + Math.floor(lvl / 6));
    const activeColors = BUBBLE_COLORS.slice(0, numColors);

    this.grid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));

    const fillRows = Math.min(6, 3 + Math.floor(lvl / 10));
    for (let r = 0; r < fillRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const color = activeColors[Math.floor(Math.random() * activeColors.length)];
        this.grid[r][c] = { r, c, color, x: 0, y: 0 };
      }
    }

    this.currentBubble = { color: activeColors[Math.floor(Math.random() * activeColors.length)] };
    this.nextBubble = { color: activeColors[Math.floor(Math.random() * activeColors.length)] };
    this.activeFlyingBubble = null;
  }

  private setupControls() {
    if (this.canvas) {
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
      this.canvas.addEventListener('pointerup', this.handlePointerUp);
    }
  }

  private removeControls() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    }
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cannonX = this.logicalWidth / 2;
    const cannonY = this.logicalHeight - 60;
    this.aimAngle = Math.atan2(y - cannonY, x - cannonX);
  };

  private handlePointerUp = () => {
    if (!this.isRunning || this.isPaused || this.activeFlyingBubble || this.ammoLeft <= 0) return;

    const speed = 16;
    const cannonX = this.logicalWidth / 2;
    const cannonY = this.logicalHeight - 60;

    this.activeFlyingBubble = {
      x: cannonX,
      y: cannonY,
      vx: Math.cos(this.aimAngle) * speed,
      vy: Math.sin(this.aimAngle) * speed,
      color: this.currentBubble.color
    };

    this.ammoLeft--;
    this.currentBubble = { ...this.nextBubble };
    const numColors = Math.min(BUBBLE_COLORS.length, 3 + Math.floor(this.level / 6));
    const activeColors = BUBBLE_COLORS.slice(0, numColors);
    this.nextBubble = { color: activeColors[Math.floor(Math.random() * activeColors.length)] };

    storageService.triggerHaptic('light');
    audioService.playSfx('pop');
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
    if (this.activeFlyingBubble) {
      const b = this.activeFlyingBubble;
      b.x += b.vx;
      b.y += b.vy;

      const width = this.logicalWidth;
      if (b.x - this.bubbleRadius <= 0 || b.x + this.bubbleRadius >= width) {
        b.vx = -b.vx;
      }

      // Check collision with top wall or grid bubbles
      const topY = 70;
      if (b.y - this.bubbleRadius <= topY || this.checkGridCollision(b)) {
        this.snapToGrid(b);
        this.activeFlyingBubble = null;
      }
    }
  }

  private checkGridCollision(b: { x: number; y: number; color: string }): boolean {
    const width = this.logicalWidth;
    const startX = (width - this.gridCols * this.bubbleRadius * 2) / 2 + this.bubbleRadius;
    const startY = 90;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.grid[r][c]) {
          const gx = startX + c * this.bubbleRadius * 2;
          const gy = startY + r * this.bubbleRadius * 2;
          const dist = Math.hypot(b.x - gx, b.y - gy);
          if (dist < this.bubbleRadius * 1.8) return true;
        }
      }
    }
    return false;
  }

  private snapToGrid(b: { x: number; y: number; color: string }) {
    const width = this.logicalWidth;
    const startX = (width - this.gridCols * this.bubbleRadius * 2) / 2 + this.bubbleRadius;
    const startY = 90;

    const c = Math.max(0, Math.min(this.gridCols - 1, Math.floor((b.x - startX + this.bubbleRadius) / (this.bubbleRadius * 2))));
    const r = Math.max(0, Math.min(this.gridRows - 1, Math.floor((b.y - startY + this.bubbleRadius) / (this.bubbleRadius * 2))));

    this.grid[r][c] = { r, c, color: b.color, x: 0, y: 0 };
    this.popCluster(r, c, b.color);
  }

  private popCluster(r: number, c: number, color: string) {
    const cluster: { r: number; c: number }[] = [];
    const visited = new Set<string>();

    const dfs = (cr: number, cc: number) => {
      const key = `${cr},${cc}`;
      if (visited.has(key)) return;
      visited.add(key);

      if (cr < 0 || cr >= this.gridRows || cc < 0 || cc >= this.gridCols) return;
      if (!this.grid[cr][cc] || this.grid[cr][cc]!.color !== color) return;

      cluster.push({ r: cr, c: cc });

      dfs(cr - 1, cc);
      dfs(cr + 1, cc);
      dfs(cr, cc - 1);
      dfs(cr, cc + 1);
    };

    dfs(r, c);

    if (cluster.length >= 3) {
      cluster.forEach(({ r, c }) => {
        this.grid[r][c] = null;
      });
      this.score += cluster.length * 100;
      this.onScoreUpdate(this.score);
      storageService.triggerHaptic('medium');
      audioService.playSfx('powerup');
    }

    // Check Win
    let hasBubbles = false;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.grid[r][c]) hasBubbles = true;
      }
    }

    if (!hasBubbles) {
      if (this.level < 100) {
        this.level++;
        storageService.saveGameState('bubble-shooter', {
          unlockedLevels: this.level,
          highScore: this.score
        });
        storageService.triggerHaptic('success');
        audioService.playSfx('win');
        this.setupLevel(this.level);
      }
    } else if (this.ammoLeft <= 0 && !this.activeFlyingBubble) {
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
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`AMMO: ${this.ammoLeft}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Grid Bubbles
    const startX = (width - this.gridCols * this.bubbleRadius * 2) / 2 + this.bubbleRadius;
    const startY = 90;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const b = this.grid[r][c];
        if (b) {
          const gx = startX + c * this.bubbleRadius * 2;
          const gy = startY + r * this.bubbleRadius * 2;
          this.ctx.fillStyle = b.color;
          this.ctx.beginPath();
          this.ctx.arc(gx, gy, this.bubbleRadius - 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // Draw Aiming Line
    const cannonX = width / 2;
    const cannonY = height - 60;
    this.ctx.strokeStyle = 'rgba(0,240,255,0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cannonX, cannonY);
    this.ctx.lineTo(cannonX + Math.cos(this.aimAngle) * 150, cannonY + Math.sin(this.aimAngle) * 150);
    this.ctx.stroke();

    // Draw Flying Bubble
    if (this.activeFlyingBubble) {
      this.ctx.fillStyle = this.activeFlyingBubble.color;
      this.ctx.beginPath();
      this.ctx.arc(this.activeFlyingBubble.x, this.activeFlyingBubble.y, this.bubbleRadius - 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Cannon & Current Bubble
    this.ctx.fillStyle = this.currentBubble.color;
    this.ctx.beginPath();
    this.ctx.arc(cannonX, cannonY, this.bubbleRadius, 0, Math.PI * 2);
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
