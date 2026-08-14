import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Delivery {
  y: number;
  speed: number;
  type: 'fast' | 'spin' | 'yorker';
  active: boolean;
}

export class CricketSmashGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private lastTime = 0;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Match State
  private score = 0;
  private wickets = 0;
  private ballsBowled = 0;
  private maxBalls = 12; // 2 Overs

  // Pitch & Ball Physics
  private currentDelivery: Delivery | null = null;
  private shotFxTimer = 0;
  private shotFxText = '';

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

    this.score = 0;
    this.wickets = 0;
    this.ballsBowled = 0;
    this.currentDelivery = null;

    this.isRunning = true;
    this.isPaused = false;

    this.setupControls();
    this.spawnDelivery();

    audioService.startSynthMusic('sports');
    ManuPlayGameSDK.gameStarted('cricket-smash');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
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

  private spawnDelivery() {
    if (this.ballsBowled >= this.maxBalls || this.wickets >= 10) {
      this.endGame();
      return;
    }

    const types: Array<'fast' | 'spin' | 'yorker'> = ['fast', 'spin', 'yorker'];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = type === 'fast' ? 520 : type === 'yorker' ? 600 : 420;

    this.currentDelivery = {
      y: 120,
      speed,
      type,
      active: true
    };
  }

  private setupControls() {
    const handleHit = () => {
      if (!this.currentDelivery || !this.currentDelivery.active || !this.isRunning || this.isPaused) return;

      const pitchY = this.logicalHeight - 160;
      const ballY = this.currentDelivery.y;
      const diff = Math.abs(ballY - pitchY);

      this.currentDelivery.active = false;
      this.ballsBowled++;

      if (diff < 25) {
        // PERFECT TIMING -> SIX!
        const runs = 6;
        this.score += runs;
        this.shotFxText = '💥 HUGE SIXER! 6 RUNS!';
        this.shotFxTimer = 1.2;
        audioService.playCoin();
        storageService.triggerHaptic('success');
      } else if (diff < 55) {
        // GOOD TIMING -> FOUR!
        const runs = 4;
        this.score += runs;
        this.shotFxText = '⚡ POWER BOUNDARY! 4 RUNS!';
        this.shotFxTimer = 1.0;
        audioService.playClick();
        storageService.triggerHaptic('light');
      } else if (diff < 90) {
        // AVERAGE TIMING -> 1 or 2 RUNS
        const runs = Math.random() < 0.5 ? 1 : 2;
        this.score += runs;
        this.shotFxText = `🏏 SWIPE SHOT! +${runs} RUNS`;
        this.shotFxTimer = 0.8;
        audioService.playClick();
      } else {
        // MISSED / WICKET!
        this.wickets++;
        this.shotFxText = '🔴 OUT! BOWLED!';
        this.shotFxTimer = 1.2;
        audioService.playExplosion();
        storageService.triggerHaptic('error');
      }

      this.onScoreUpdate(this.score);

      setTimeout(() => {
        if (this.isRunning) this.spawnDelivery();
      }, 1000);
    };

    if (this.canvas) {
      this.canvas.addEventListener('click', handleHit);
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleHit();
      }, { passive: false });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleHit();
      }
    });
  }

  private endGame() {
    audioService.playGameOver();
    ManuPlayGameSDK.gameCompleted('cricket-smash', this.score);
    this.destroy();
    this.onGameOver(this.score);
  }

  public pause() {
    this.isPaused = true;
    audioService.stopSynthMusic();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    audioService.startSynthMusic('sports');
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
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
    if (this.shotFxTimer > 0) {
      this.shotFxTimer -= dt;
    }

    if (this.currentDelivery && this.currentDelivery.active) {
      this.currentDelivery.y += this.currentDelivery.speed * dt;

      // Ball missed completely past pitch
      if (this.currentDelivery.y > this.logicalHeight - 80) {
        this.currentDelivery.active = false;
        this.ballsBowled++;
        this.wickets++;
        this.shotFxText = '🔴 CLEAN BOWLED!';
        this.shotFxTimer = 1.2;
        audioService.playExplosion();
        storageService.triggerHaptic('error');

        setTimeout(() => {
          if (this.isRunning) this.spawnDelivery();
        }, 1000);
      }
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Grass Field Stadium Background
    ctx.fillStyle = '#0b2b18';
    ctx.fillRect(0, 0, w, h);

    // Clay Pitch Strip
    const pitchW = 120;
    const pitchX = (w - pitchW) / 2;
    ctx.fillStyle = '#947547';
    ctx.fillRect(pitchX, 80, pitchW, h - 160);

    // Stumps (Wickets) at bottom
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(w / 2 - 16 + s * 14, h - 140, 4, 30);
    }

    // Hit Timing Zone Target Line
    const targetY = h - 160;
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(pitchX - 10, targetY);
    ctx.lineTo(pitchX + pitchW + 10, targetY);
    ctx.stroke();
    ctx.restore();

    // Delivery Ball
    if (this.currentDelivery && this.currentDelivery.active) {
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ffaa00';
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(w / 2, this.currentDelivery.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shot Result Text FX Banner
    if (this.shotFxTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.fillText(this.shotFxText, w / 2, h / 2 - 40);
      ctx.restore();
    }

    // HUD Display
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    const currentOver = `${Math.floor(this.ballsBowled / 6)}.${this.ballsBowled % 6}`;
    ctx.fillText(`🏏 SCORE: ${this.score}/${this.wickets}   OVERS: ${currentOver}/2.0`, 20, 40);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('TAP SCREEN WHEN BALL CROSSES THE CYAN TIMING LINE', 20, h - 40);
    ctx.restore();
  }
}
