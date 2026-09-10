import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Delivery {
  y: number;
  x: number;
  speed: number;
  type: 'fast' | 'spin' | 'yorker';
  active: boolean;
  bounced: boolean;
  bounceY: number;
}

interface FlyingBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
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

  // Match State & Level Progression
  public level = 1;
  public score = 0;
  private wickets = 0;
  private maxWickets = 3;
  private ballsBowled = 0;
  private maxOvers = 2;
  private maxBalls = 12;

  // Dynamic Target Chase
  private targetScore = 36;
  private isTargetChased = false;

  // Pitch & Ball Physics
  private currentDelivery: Delivery | null = null;
  private flyingBall: FlyingBall | null = null;
  private shotFxTimer = 0;
  private shotFxText = '';
  private shotDistance = '';

  // Bowler & Batsman State
  private bowlerState: 'idle' | 'runup' | 'release' = 'idle';
  private bowlerRunupY = 50;
  private batAngle = 0; // Degrees
  private isSwingingBat = false;
  private swingTimer = 0;
  private hitSparkPos: { x: number; y: number } | null = null;
  private hitSparkTimer = 0;

  constructor(
    onGameOver: (score: number) => void,
    onScoreUpdate: (score: number) => void
  ) {
    this.onGameOver = onGameOver;
    this.onScoreUpdate = onScoreUpdate;
  }

  private selectedOvers = 2;

  public static generateTargetForOvers(overs: number): number {
    if (overs === 1) {
      // 1 Over: 10 to 18 runs
      return 10 + Math.floor(Math.random() * 9);
    } else if (overs === 2) {
      // 2 Overs: 22 to 34 runs
      return 22 + Math.floor(Math.random() * 13);
    } else if (overs === 3) {
      // 3 Overs: 35 to 52 runs
      return 35 + Math.floor(Math.random() * 18);
    } else if (overs === 5) {
      // 5 Overs: 60 to 90 runs
      return 60 + Math.floor(Math.random() * 31);
    } else if (overs === 10) {
      // 10 Overs: 110 to 170 runs
      return 110 + Math.floor(Math.random() * 61);
    } else {
      const min = Math.round(overs * 11);
      const max = Math.round(overs * 17);
      return min + Math.floor(Math.random() * (max - min + 1));
    }
  }

  public init(canvas: HTMLCanvasElement, options?: { overs?: number }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    if (options?.overs) {
      this.selectedOvers = options.overs;
    }

    this.resize();
    window.addEventListener('resize', this.resize);

    storageService.loadGameState('cricket-smash').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupMatch(this.selectedOvers);
    });

    this.isRunning = true;
    this.isPaused = false;

    this.setupControls();
    this.startBowlerSequence();

    audioService.startSynthMusic('sports');
    ManuPlayGameSDK.gameStarted('cricket-smash');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public setupMatch(overs?: number) {
    if (overs) {
      this.selectedOvers = overs;
    }
    this.maxOvers = this.selectedOvers;
    this.maxBalls = this.maxOvers * 6;
    this.maxWickets = Math.min(10, Math.max(3, Math.floor(this.maxOvers * 1.5)));
    this.score = 0;
    this.wickets = 0;
    this.ballsBowled = 0;
    this.currentDelivery = null;
    this.flyingBall = null;
    this.isTargetChased = false;

    // Dynamic Randomized Target Score Chase based on selected overs!
    this.targetScore = CricketSmashGame.generateTargetForOvers(this.maxOvers);
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

  private startBowlerSequence() {
    if (this.isTargetChased || this.ballsBowled >= this.maxBalls || this.wickets >= this.maxWickets) {
      this.endGame();
      return;
    }

    this.bowlerState = 'runup';
    this.bowlerRunupY = 40;

    setTimeout(() => {
      if (!this.isRunning) return;
      this.bowlerState = 'release';
      this.spawnDelivery();
    }, 600);
  }

  private spawnDelivery() {
    const types: Array<'fast' | 'spin' | 'yorker'> = ['fast', 'spin', 'yorker'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Balanced accessible speed curve (Level 1: 290 px/s)
    const baseSpeed = 290 + Math.min(180, (this.level - 1) * 3);
    const speed = type === 'fast' ? baseSpeed * 1.15 : type === 'yorker' ? baseSpeed * 1.05 : baseSpeed * 0.9;

    const pitchCenter = this.logicalWidth / 2;
    const bounceY = this.logicalHeight * 0.52 + (Math.random() - 0.5) * 30;

    this.currentDelivery = {
      x: pitchCenter,
      y: 100,
      speed,
      type,
      active: true,
      bounced: false,
      bounceY
    };
  }

  private setupControls() {
    const handleHit = () => {
      if (!this.isRunning || this.isPaused || this.isSwingingBat || this.isTargetChased) return;

      this.isSwingingBat = true;
      this.swingTimer = 0.35;

      const pitchY = this.logicalHeight - 170;
      const pitchX = this.logicalWidth / 2;

      if (this.currentDelivery && this.currentDelivery.active) {
        const ballY = this.currentDelivery.y;
        const diff = Math.abs(ballY - pitchY);

        this.currentDelivery.active = false;
        this.ballsBowled++;

        if (diff < 85) {
          // PERFECT TIMING -> MASSIVE SIXER!
          const runs = 6;
          this.score += runs;
          const dist = 95 + Math.floor(Math.random() * 35);
          this.shotFxText = '💥 HUGE SIXER! 6 RUNS!';
          this.shotDistance = `SHOT DISTANCE: ${dist} METERS`;
          this.shotFxTimer = 1.6;

          this.hitSparkPos = { x: pitchX, y: pitchY };
          this.hitSparkTimer = 0.5;

          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
          this.flyingBall = {
            x: pitchX,
            y: pitchY,
            vx: Math.cos(angle) * 750,
            vy: Math.sin(angle) * 750,
            radius: 13,
            active: true
          };

          audioService.playCoin();
          storageService.triggerHaptic('heavy');
        } else if (diff < 150) {
          // GOOD TIMING -> POWER BOUNDARY FOUR!
          const runs = 4;
          this.score += runs;
          this.shotFxText = '⚡ POWER BOUNDARY! 4 RUNS!';
          this.shotDistance = 'SHOT SPEED: 148 KM/H';
          this.shotFxTimer = 1.4;

          this.hitSparkPos = { x: pitchX, y: pitchY };
          this.hitSparkTimer = 0.4;

          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
          this.flyingBall = {
            x: pitchX,
            y: pitchY,
            vx: Math.cos(angle) * 600,
            vy: Math.sin(angle) * 600,
            radius: 12,
            active: true
          };

          audioService.playClick();
          storageService.triggerHaptic('medium');
        } else if (diff < 220) {
          // SOLID TIMING -> 2 or 3 RUNS
          const runs = Math.random() < 0.6 ? 2 : 3;
          this.score += runs;
          this.shotFxText = `🏏 NICE PLACEMENT! +${runs} RUNS`;
          this.shotDistance = 'SHOT SPEED: 110 KM/H';
          this.shotFxTimer = 1.2;

          this.hitSparkPos = { x: pitchX, y: pitchY };
          this.hitSparkTimer = 0.3;

          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
          this.flyingBall = {
            x: pitchX,
            y: pitchY,
            vx: Math.cos(angle) * 420,
            vy: Math.sin(angle) * 420,
            radius: 11,
            active: true
          };

          audioService.playClick();
          storageService.triggerHaptic('light');
        } else if (diff < 280) {
          // SINGLE RUN
          const runs = 1;
          this.score += runs;
          this.shotFxText = '🏃 QUICK SINGLE! +1 RUN';
          this.shotDistance = '';
          this.shotFxTimer = 1.0;

          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
          this.flyingBall = {
            x: pitchX,
            y: pitchY,
            vx: Math.cos(angle) * 280,
            vy: Math.sin(angle) * 280,
            radius: 10,
            active: true
          };

          audioService.playClick();
          storageService.triggerHaptic('light');
        } else {
          // MISSED SHOT -> OUT!
          this.wickets++;
          this.shotFxText = '🔴 OUT! MISSED SHOT!';
          this.shotDistance = '';
          this.shotFxTimer = 1.4;

          audioService.playExplosion();
          storageService.triggerHaptic('error');
        }

        this.onScoreUpdate(this.score);

        // Check if Target is Chased!
        if (this.score >= this.targetScore) {
          this.isTargetChased = true;
          if (this.level < 100) {
            this.level++;
            storageService.saveGameState('cricket-smash', {
              unlockedLevels: this.level,
              highScore: this.score
            });
            storageService.triggerHaptic('success');
            audioService.playSfx('win');
          }
        }

        setTimeout(() => {
          if (this.isRunning) this.startBowlerSequence();
        }, 1200);
      }
    };

    if (this.canvas) {
      this.canvas.addEventListener('click', handleHit);
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleHit();
      }, { passive: false });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
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

    if (this.hitSparkTimer > 0) {
      this.hitSparkTimer -= dt;
    }

    if (this.isSwingingBat) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0) {
        this.isSwingingBat = false;
        this.batAngle = 0;
      } else {
        const progress = 1 - (this.swingTimer / 0.25);
        this.batAngle = -45 + progress * 135;
      }
    }

    if (this.bowlerState === 'runup') {
      this.bowlerRunupY += dt * 100;
    }

    if (this.currentDelivery && this.currentDelivery.active) {
      this.currentDelivery.y += this.currentDelivery.speed * dt;

      if (this.currentDelivery.y >= this.currentDelivery.bounceY && !this.currentDelivery.bounced) {
        this.currentDelivery.bounced = true;
        audioService.playClick();
      }

      if (this.currentDelivery.y > this.logicalHeight - 120) {
        this.currentDelivery.active = false;
        this.ballsBowled++;
        this.wickets++;
        this.shotFxText = '🔴 CLEAN BOWLED!';
        this.shotDistance = '';
        this.shotFxTimer = 1.4;

        audioService.playExplosion();
        storageService.triggerHaptic('error');

        setTimeout(() => {
          if (this.isRunning) this.startBowlerSequence();
        }, 1200);
      }
    }

    if (this.flyingBall && this.flyingBall.active) {
      this.flyingBall.x += this.flyingBall.vx * dt;
      this.flyingBall.y += this.flyingBall.vy * dt;

      if (
        this.flyingBall.x < 0 ||
        this.flyingBall.x > this.logicalWidth ||
        this.flyingBall.y < 0
      ) {
        this.flyingBall.active = false;
      }
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Grass Field Radial Gradient
    const grassGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, h * 0.7);
    grassGrad.addColorStop(0, '#15803d');
    grassGrad.addColorStop(0.7, '#166534');
    grassGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, w, h);

    // Boundary Rope
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 20, Math.min(w, h) * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Clay Pitch Strip
    const pitchW = 110;
    const pitchX = (w - pitchW) / 2;
    const pitchY = 80;
    const pitchH = h - 220;

    const pitchGrad = ctx.createLinearGradient(pitchX, 0, pitchX + pitchW, 0);
    pitchGrad.addColorStop(0, '#a16207');
    pitchGrad.addColorStop(0.5, '#ca8a04');
    pitchGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

    // Crease Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(pitchX + 10, pitchY + 20, pitchW - 20, 2);
    const battingCreaseY = h - 170;
    ctx.strokeRect(pitchX + 10, battingCreaseY, pitchW - 20, 2);

    // Glowing BATTING HIT ZONE Bounding Box
    const isBallInHitZone = this.currentDelivery && this.currentDelivery.active && Math.abs(this.currentDelivery.y - battingCreaseY) < 160;

    ctx.save();
    ctx.fillStyle = isBallInHitZone ? 'rgba(16, 185, 129, 0.28)' : 'rgba(0, 240, 255, 0.12)';
    ctx.strokeStyle = isBallInHitZone ? '#10b981' : 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = isBallInHitZone ? 3 : 1.5;
    if (isBallInHitZone) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#10b981';
    }
    ctx.fillRect(pitchX + 5, battingCreaseY - 140, pitchW - 10, 180);
    ctx.strokeRect(pitchX + 5, battingCreaseY - 140, pitchW - 10, 180);
    ctx.restore();

    // Dynamic TAP TO HIT Prompt
    if (isBallInHitZone && !this.isSwingingBat) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#10b981';
      ctx.fillText('⚡ TAP NOW TO HIT! 🏏', w / 2, battingCreaseY - 152);
      ctx.restore();
    }

    // Cyan Timing Line
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(pitchX - 15, battingCreaseY);
    ctx.lineTo(pitchX + pitchW + 15, battingCreaseY);
    ctx.stroke();
    ctx.restore();

    // Wickets
    ctx.fillStyle = '#fef08a';
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(w / 2 - 14 + s * 12, h - 165, 5, 32);
    }
    ctx.fillStyle = '#eab308';
    ctx.fillRect(w / 2 - 16, h - 168, 34, 4);

    // Bowler
    const bowlerY = this.bowlerState === 'runup' ? this.bowlerRunupY : 65;
    this.renderBowler(w / 2, bowlerY);

    // Batsman
    this.renderBatsman(w / 2 + 15, h - 175);

    // Ball Bounce
    if (this.currentDelivery && this.currentDelivery.bounced) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(w / 2, this.currentDelivery.bounceY, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Ball
    if (this.currentDelivery && this.currentDelivery.active) {
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(w / 2, this.currentDelivery.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Flying Ball
    if (this.flyingBall && this.flyingBall.active) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(this.flyingBall.x, this.flyingBall.y, this.flyingBall.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hit Spark
    if (this.hitSparkTimer > 0 && this.hitSparkPos) {
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#00f0ff';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', this.hitSparkPos.x, this.hitSparkPos.y);
      ctx.restore();
    }

    // Shot Result Text
    if (this.shotFxTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.fillText(this.shotFxText, w / 2, h / 2 - 30);

      if (this.shotDistance) {
        ctx.fillStyle = '#00f0ff';
        ctx.font = '900 15px sans-serif';
        ctx.fillText(this.shotDistance, w / 2, h / 2);
      }
      ctx.restore();
    }

    // Target Chased Victory Banner
    if (this.isTargetChased) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#10b981';
      ctx.fillText('🏆 TARGET CHASED! VICTORY!', w / 2, h / 2 - 60);
      ctx.restore();
    }

    // HUD Header Banner & Target Chase Display
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(10, 35, w - 20, 50);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 35, w - 20, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px sans-serif';
    const currentOver = `${Math.floor(this.ballsBowled / 6)}.${this.ballsBowled % 6}`;
    const runsNeeded = Math.max(0, this.targetScore - this.score);
    const ballsRemaining = Math.max(0, this.maxBalls - this.ballsBowled);

    ctx.fillText(`🏏 SCORE: ${this.score}/${this.wickets} (${currentOver}/${this.maxOvers}.0)`, 20, 53);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`LVL ${this.level} / 100`, 20, 72);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`🎯 TARGET: ${this.targetScore} RUNS`, w - 20, 53);

    ctx.fillStyle = runsNeeded > 0 ? '#38bdf8' : '#10b981';
    ctx.fillText(runsNeeded > 0 ? `NEED ${runsNeeded} RUNS OFF ${ballsRemaining} BALLS` : 'TARGET CHASED! 🎉', w - 20, 72);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 11px sans-serif';
    ctx.fillText('TAP SCREEN OR PRESS SPACE TO SWING BAT', w / 2, h - 25);
    ctx.restore();
  }

  private renderBowler(x: number, y: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-10, -7, 20, 18);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-18, 5);
    ctx.moveTo(10, -4);
    ctx.lineTo(18, 5);
    ctx.stroke();

    ctx.restore();
  }

  private renderBatsman(x: number, y: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-10, -26, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-16, -24, 12, 4);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-18, -14, 20, 22);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-18, 8, 8, 20);
    ctx.fillRect(-8, 8, 8, 20);

    ctx.save();
    ctx.translate(-5, -5);
    ctx.rotate((this.batAngle * Math.PI) / 180);

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-2, -18, 4, 12);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, -6, 10, 36);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-5, -6, 10, 36);

    ctx.restore();

    ctx.restore();
  }
}
