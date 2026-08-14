import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

export class PenaltyShootoutGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private shotsTaken = 0;
  private maxShots = 5;
  private goalsScored = 0;
  private score = 0;

  // Ball State
  private ballX = 200;
  private ballY = 550;
  private isBallInFlight = false;
  private ballVx = 0;
  private ballVy = 0;

  // Goalkeeper AI State
  private keeperX = 200;
  private keeperTargetX = 200;

  // Touch Aim State
  private isAiming = false;
  private aimStartX = 0;
  private aimStartY = 0;
  private aimCurrentX = 0;
  private aimCurrentY = 0;

  private resultFxText = '';

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

    this.shotsTaken = 0;
    this.goalsScored = 0;
    this.score = 0;
    this.resetBall();

    this.isRunning = true;
    this.isPaused = false;

    this.setupTouch();

    audioService.startSynthMusic('sports');
    ManuPlayGameSDK.gameStarted('penalty-shootout');
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

  private resetBall() {
    this.ballX = this.logicalWidth / 2;
    this.ballY = this.logicalHeight - 120;
    this.isBallInFlight = false;
    this.keeperX = this.logicalWidth / 2;
  }

  private setupTouch() {
    if (!this.canvas) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!this.isRunning || this.isPaused || this.isBallInFlight) return;
      const rect = this.canvas!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.isAiming = true;
      this.aimStartX = clientX - rect.left;
      this.aimStartY = clientY - rect.top;
      this.aimCurrentX = this.aimStartX;
      this.aimCurrentY = this.aimStartY;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isAiming) return;
      const rect = this.canvas!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.aimCurrentX = clientX - rect.left;
      this.aimCurrentY = clientY - rect.top;
    };

    const handleEnd = () => {
      if (!this.isAiming) return;
      this.isAiming = false;

      const dx = this.aimCurrentX - this.aimStartX;
      const dy = this.aimCurrentY - this.aimStartY;

      if (dy < -20) {
        this.isBallInFlight = true;
        this.ballVx = dx * 1.5;
        this.ballVy = dy * 1.5;

        // Keeper dives left or right randomly
        this.keeperTargetX = this.logicalWidth / 2 + (Math.random() - 0.5) * 160;

        audioService.playJump();
        storageService.triggerHaptic('light');
      }
    };

    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', handleStart, { passive: true });
    this.canvas.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    audioService.startSynthMusic('sports');
    this.loop();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (this.isBallInFlight) {
      this.ballX += this.ballVx * 0.03;
      this.ballY += this.ballVy * 0.03;

      this.keeperX += (this.keeperTargetX - this.keeperX) * 0.1;

      // Ball reached goal line
      if (this.ballY <= 150) {
        this.shotsTaken++;
        const goalLeft = this.logicalWidth / 2 - 100;
        const goalRight = this.logicalWidth / 2 + 100;

        const isSaved = Math.hypot(this.ballX - this.keeperX, this.ballY - 150) < 35;
        const isGoal = this.ballX >= goalLeft && this.ballX <= goalRight && !isSaved;

        if (isGoal) {
          this.goalsScored++;
          this.score += 500;
          this.resultFxText = '⚽ GOAL!';
          audioService.playCoin();
          storageService.triggerHaptic('success');
        } else {
          this.resultFxText = isSaved ? '🧤 SAVED BY KEEPER!' : '❌ MISSED GOAL!';
          audioService.playExplosion();
          storageService.triggerHaptic('error');
        }

        this.onScoreUpdate(this.score);

        setTimeout(() => {
          if (this.shotsTaken >= this.maxShots) {
            audioService.playGameOver();
            ManuPlayGameSDK.gameCompleted('penalty-shootout', this.score);
            this.destroy();
            this.onGameOver(this.score);
          } else {
            this.resetBall();
          }
        }, 1200);

        this.isBallInFlight = false;
      }
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Grass Field Background
    ctx.fillStyle = '#0a2e18';
    ctx.fillRect(0, 0, w, h);

    // Goal Post Framing
    const goalW = 220;
    const goalX = (w - goalW) / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(goalX, 80, goalW, 100);

    // Goalkeeper AI
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(this.keeperX, 150, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Touch Drag Aim Line Preview
    if (this.isAiming) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(this.ballX, this.ballY);
      ctx.lineTo(this.ballX + (this.aimCurrentX - this.aimStartX), this.ballY + (this.aimCurrentY - this.aimStartY));
      ctx.stroke();
      ctx.restore();
    }

    // Football
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Result Text
    if (this.resultFxText) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.fillText(this.resultFxText, w / 2, h / 2);
      ctx.restore();
    }

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`⚽ SHOTS: ${this.shotsTaken}/${this.maxShots}   GOALS: ${this.goalsScored}`, 20, 40);
    ctx.restore();
  }
}
