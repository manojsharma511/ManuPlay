import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';
import { inputService } from '../../services/InputService';

interface TrafficCar {
  x: number;
  y: number;
  speed: number;
  color: string;
}

export class CarDodgeGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private distanceCovered = 0;
  private targetDistance = 1000;

  private currentLane = 1;
  private numLanes = 3;

  private wasLeftPressed = false;
  private wasRightPressed = false;
  private traffic: TrafficCar[] = [];

  private CAR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

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

    storageService.loadGameState('car-dodge').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('racing');
    ManuPlayGameSDK.gameStarted('car-dodge');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.distanceCovered = 0;
    this.targetDistance = 1000 + lvl * 500;
    this.numLanes = lvl > 20 ? 4 : 3;
    this.currentLane = Math.floor(this.numLanes / 2);
    this.traffic = [];
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;

    if (e.key === 'ArrowLeft' || e.key === 'a') {
      if (this.currentLane > 0) {
        this.currentLane--;
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
      }
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      if (this.currentLane < this.numLanes - 1) {
        this.currentLane++;
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
      }
    }
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
    const input = inputService.getState();
    if (input.left && !this.wasLeftPressed) {
      if (this.currentLane > 0) {
        this.currentLane--;
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
      }
      this.wasLeftPressed = true;
    }
    if (!input.left) this.wasLeftPressed = false;

    if (input.right && !this.wasRightPressed) {
      if (this.currentLane < this.numLanes - 1) {
        this.currentLane++;
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
      }
      this.wasRightPressed = true;
    }
    if (!input.right) this.wasRightPressed = false;

    this.distanceCovered += 5 + this.level * 0.2;
    this.score = Math.floor(this.distanceCovered);
    this.onScoreUpdate(this.score);

    // Spawn traffic
    if (Math.random() < 0.04 + this.level * 0.002) {
      const lane = Math.floor(Math.random() * this.numLanes);
      this.traffic.push({
        x: lane,
        y: -100,
        speed: 4 + Math.random() * 3 + this.level * 0.1,
        color: this.CAR_COLORS[Math.floor(Math.random() * this.CAR_COLORS.length)]
      });
    }

    const height = this.logicalHeight;
    const playerY = height - 120;

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.y += t.speed;

      // Collision check
      if (t.x === this.currentLane && Math.abs(t.y - playerY) < 55) {
        // Crash! Game Over
        this.isRunning = false;
        storageService.triggerHaptic('error');
        audioService.playSfx('gameover');
        this.onGameOver(this.score);
        return;
      }

      if (t.y > height + 100) {
        this.traffic.splice(i, 1);
      }
    }

    // Check Win Level
    if (this.distanceCovered >= this.targetDistance) {
      if (this.level < 100) {
        this.level++;
        storageService.saveGameState('car-dodge', {
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

    // Highway Background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`DISTANCE: ${Math.floor(this.distanceCovered)}m / ${this.targetDistance}m`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Lanes
    const laneWidth = (width - 40) / this.numLanes;
    const startX = 20;

    for (let i = 0; i <= this.numLanes; i++) {
      const lx = startX + i * laneWidth;
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([20, 20]);
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 70);
      this.ctx.lineTo(lx, height);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw Traffic Cars
    for (const t of this.traffic) {
      const cx = startX + t.x * laneWidth + laneWidth / 2;
      this.ctx.fillStyle = t.color;
      this.ctx.fillRect(cx - 20, t.y - 30, 40, 60);
    }

    // Draw Player Car
    const playerX = startX + this.currentLane * laneWidth + laneWidth / 2;
    const playerY = height - 120;

    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(playerX - 22, playerY - 35, 44, 70);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(playerX - 18, playerY - 25, 36, 15);
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
