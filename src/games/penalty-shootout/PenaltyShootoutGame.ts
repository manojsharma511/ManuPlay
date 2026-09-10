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
  private ballScale = 1;

  // Goalkeeper AI State & Dive Animation
  private keeperX = 200;
  private keeperY = 150;
  private keeperTargetX = 200;
  private keeperState: 'idle' | 'diveLeft' | 'diveRight' = 'idle';

  // Touch Aim State
  private isAiming = false;
  private aimStartX = 0;
  private aimStartY = 0;
  private aimCurrentX = 0;
  private aimCurrentY = 0;

  private resultFxText = '';
  private fxTimer = 0;

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
    this.resultFxText = '';
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
    this.ballScale = 1;
    this.isBallInFlight = false;
    this.keeperX = this.logicalWidth / 2;
    this.keeperY = 150;
    this.keeperState = 'idle';
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
        this.ballVx = dx * 1.6;
        this.ballVy = dy * 1.6;

        // Keeper dives left or right
        const diveDir = Math.random() < 0.5 ? -1 : 1;
        this.keeperTargetX = this.logicalWidth / 2 + diveDir * (80 + Math.random() * 60);
        this.keeperState = diveDir < 0 ? 'diveLeft' : 'diveRight';

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
    if (this.fxTimer > 0) this.fxTimer -= 0.02;

    if (this.isBallInFlight) {
      this.ballX += this.ballVx * 0.03;
      this.ballY += this.ballVy * 0.03;
      this.ballScale = Math.max(0.6, 1 - ( (this.logicalHeight - 120 - this.ballY) / 600 ));

      this.keeperX += (this.keeperTargetX - this.keeperX) * 0.15;

      // Ball reached goal line
      if (this.ballY <= 150) {
        this.shotsTaken++;
        const goalLeft = this.logicalWidth / 2 - 100;
        const goalRight = this.logicalWidth / 2 + 100;

        const isSaved = Math.hypot(this.ballX - this.keeperX, this.ballY - 150) < 42;
        const isGoal = this.ballX >= goalLeft && this.ballX <= goalRight && !isSaved;

        if (isGoal) {
          this.goalsScored++;
          this.score += 500;
          this.resultFxText = '⚽ GOAL! MAGNIFICENT SHOT!';
          this.fxTimer = 1.2;
          audioService.playCoin();
          storageService.triggerHaptic('success');
        } else {
          this.resultFxText = isSaved ? '🧤 SAVED BY KEEPER!' : '❌ MISSED GOAL!';
          this.fxTimer = 1.2;
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

    // Grass Field Stadium Radial Gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, h * 0.7);
    bgGrad.addColorStop(0, '#15803d');
    bgGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Goal Post Framing & Netting Grid
    const goalW = 220;
    const goalH = 100;
    const goalX = (w - goalW) / 2;
    const goalY = 80;

    // Goal Netting
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let x = goalX; x <= goalX + goalW; x += 15) {
      ctx.beginPath(); ctx.moveTo(x, goalY); ctx.lineTo(x, goalY + goalH); ctx.stroke();
    }
    for (let y = goalY; y <= goalY + goalH; y += 15) {
      ctx.beginPath(); ctx.moveTo(goalX, y); ctx.lineTo(goalX + goalW, y); ctx.stroke();
    }

    // Goal Posts
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(goalX, goalY, goalW, goalH);

    // Penalty Spot Circle Mark
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(w / 2, h - 120, 8, 0, Math.PI * 2);
    ctx.fill();

    // Render Goalkeeper Avatar & Diving Arms
    this.renderGoalkeeper(this.keeperX, this.keeperY);

    // Touch Drag Aim Target Reticle & Line
    if (this.isAiming) {
      const targetX = this.ballX + (this.aimCurrentX - this.aimStartX);
      const targetY = this.ballY + (this.aimCurrentY - this.aimStartY);

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.ballX, this.ballY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Aim Reticle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(targetX, targetY, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Football
    ctx.save();
    ctx.translate(this.ballX, this.ballY);
    ctx.scale(this.ballScale, this.ballScale);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Football Pentagons
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Result Text Overlay Banner
    if (this.fxTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.fillText(this.resultFxText, w / 2, h / 2);
      ctx.restore();
    }

    // HUD Header Banner
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(10, 35, w - 20, 35);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 35, w - 20, 35);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px sans-serif';
    ctx.fillText(`⚽ SHOTS: ${this.shotsTaken}/${this.maxShots}   GOALS: ${this.goalsScored}`, 20, 58);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 11px sans-serif';
    ctx.fillText('SWIPE / DRAG BALL UPWARD TOWARD GOAL CORNERS TO SHOOT', w / 2, h - 25);
    ctx.restore();
  }

  private renderGoalkeeper(x: number, y: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    // Keeper Jersey Body
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-12, -10, 24, 25);

    // Keeper Head / Cap
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0, Math.PI * 2);
    ctx.fill();

    // Outstretched Diving Arms & Gloves
    ctx.fillStyle = '#ffffff';
    if (this.keeperState === 'diveLeft') {
      ctx.fillRect(-30, -15, 18, 8); // Left arm outstretched
      ctx.fillRect(10, -5, 14, 8);
    } else if (this.keeperState === 'diveRight') {
      ctx.fillRect(-22, -5, 14, 8);
      ctx.fillRect(12, -15, 18, 8); // Right arm outstretched
    } else {
      ctx.fillRect(-24, -8, 12, 8);
      ctx.fillRect(12, -8, 12, 8);
    }

    ctx.restore();
  }
}
