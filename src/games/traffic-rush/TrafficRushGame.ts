import { inputService } from '../../services/InputService';
import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Obstacle {
  lane: number;
  z: number;
  speed: number;
  color: string;
}

export class TrafficRushGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Player state
  private lane = 1;
  private targetLane = 1;
  private speed = 400; // Pixels / units per sec
  private isBoosting = false;
  private wasLeftPressed = false;
  private wasRightPressed = false;

  // Game state
  private score = 0;
  private obstacles: Obstacle[] = [];
  private unsubscribeInput: (() => void) | null = null;

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

    this.lane = 1;
    this.targetLane = 1;
    this.speed = 400;
    this.score = 0;
    this.obstacles = [];

    this.isRunning = true;
    this.isPaused = false;

    this.unsubscribeInput = inputService.subscribe(() => {});

    audioService.startSynthMusic('racing');
    ManuPlayGameSDK.gameStarted('traffic-rush');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 800;
      const height = parent.clientHeight || 450;

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
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 800;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 450;
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('racing');
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.unsubscribeInput) this.unsubscribeInput();
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning || this.isPaused) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const input = inputService.getState();

    // Discrete Lane Shift on press
    if ((input.left || input.swipeLeft) && !this.wasLeftPressed && this.targetLane > 0) {
      this.targetLane--;
      audioService.playClick();
      storageService.triggerHaptic('light');
    }
    this.wasLeftPressed = input.left || input.swipeLeft;

    if ((input.right || input.swipeRight) && !this.wasRightPressed && this.targetLane < 2) {
      this.targetLane++;
      audioService.playClick();
      storageService.triggerHaptic('light');
    }
    this.wasRightPressed = input.right || input.swipeRight;

    // Smooth lane position interpolation
    this.lane += (this.targetLane - this.lane) * (15 * dt);

    if (input.boost || input.action1 || input.up) {
      this.isBoosting = true;
      this.speed = 800;
      audioService.playEngine(true);
    } else {
      this.isBoosting = false;
      this.speed = 400;
    }

    this.score += Math.round(this.speed * dt * 0.5);
    this.onScoreUpdate(this.score);

    // Spawn 3D Obstacles
    if (Math.random() < 0.04) {
      const colors = ['#ff0055', '#ffaa00', '#00ff88', '#9900ff'];
      this.obstacles.push({
        lane: Math.floor(Math.random() * 3),
        z: 1000,
        speed: 150 + Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.z -= (this.speed + ob.speed) * dt;

      if (ob.z <= 60 && ob.z >= 0) {
        if (Math.abs(this.lane - ob.lane) < 0.55) {
          audioService.playExplosion();
          audioService.playGameOver();
          storageService.triggerHaptic('error');
          ManuPlayGameSDK.gameCompleted('traffic-rush', this.score);
          this.destroy();
          this.onGameOver(this.score);
          return;
        }
      }

      if (ob.z < -100) this.obstacles.splice(i, 1);
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, w, h);

    const horizonY = h * 0.45;

    // 3D Perspective Road
    ctx.fillStyle = '#101424';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, horizonY);
    ctx.lineTo(w * 0.6, horizonY);
    ctx.lineTo(w * 0.9, h);
    ctx.lineTo(w * 0.1, h);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff33';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 3; i++) {
      const topX = w * 0.4 + (i / 3) * (w * 0.2);
      const botX = w * 0.1 + (i / 3) * (w * 0.8);
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, h);
      ctx.stroke();
    }

    // Render 3D Perspective Obstacles
    this.obstacles.forEach(ob => {
      const scale = 1 - ob.z / 1000;
      if (scale <= 0) return;

      const y = horizonY + scale * (h - horizonY);
      const roadLeft = w * 0.1 + scale * (w * 0.3);
      const roadRight = w * 0.9 - scale * (w * 0.3);
      const laneW = (roadRight - roadLeft) / 3;
      const x = roadLeft + ob.lane * laneW + laneW / 2;
      const size = 15 + scale * 45;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = ob.color;
      ctx.fillStyle = ob.color;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.restore();
    });

    // Render Player Neon Car
    const playerY = h - 70;
    const playerX = w * 0.25 + this.lane * (w * 0.25);

    ctx.save();
    ctx.shadowBlur = this.isBoosting ? 25 : 15;
    ctx.shadowColor = this.isBoosting ? '#ff00ff' : '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(playerX - 25, playerY - 40, 50, 60);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(playerX - 20, playerY + 15, 10, 5);
    ctx.fillRect(playerX + 10, playerY + 15, 10, 5);
    ctx.restore();

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`🏎️ SPEED: ${Math.round(this.speed * 0.25)} KM/H   NITRO: ${this.isBoosting ? 'ACTIVE' : 'READY'}`, 20, 30);
    ctx.restore();
  }
}
