import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface EmbeddedBlade {
  angle: number;
}

export class BladeMasterGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;

  private targetBlades = 5;
  private remainingBlades = 5;
  private embeddedBlades: EmbeddedBlade[] = [];
  private logAngle = 0;
  private logSpeed = 0.03;
  private directionTimer = 0;

  private activeThrowBlade: { y: number; speed: number; throwing: boolean } | null = null;

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

    storageService.loadGameState('blade-master').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('blade-master');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.targetBlades = Math.min(12, 4 + Math.floor(lvl / 5));
    this.remainingBlades = this.targetBlades;
    this.embeddedBlades = [];
    this.logAngle = 0;
    this.logSpeed = (0.02 + Math.min(0.06, lvl * 0.002)) * (lvl % 2 === 0 ? 1 : -1);

    // Initial pre-embedded blades for higher levels
    if (lvl > 10) {
      const initialCount = Math.min(4, Math.floor((lvl - 5) / 10));
      for (let i = 0; i < initialCount; i++) {
        this.embeddedBlades.push({ angle: (Math.PI * 2 * i) / initialCount });
      }
    }

    this.activeThrowBlade = {
      y: this.logicalHeight - 100,
      speed: 0,
      throwing: false
    };
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private removeControls() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      this.throwBlade();
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.throwBlade();
  };

  private throwBlade() {
    if (!this.isRunning || this.isPaused || !this.activeThrowBlade || this.activeThrowBlade.throwing) return;
    this.activeThrowBlade.throwing = true;
    this.activeThrowBlade.speed = 35;
    audioService.playSfx('pop');
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
      this.update();
      this.render();
    }
    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    // Log rotation
    this.logAngle += this.logSpeed;

    // Periodically reverse log direction on higher levels
    if (this.level > 20) {
      this.directionTimer++;
      if (this.directionTimer > 120 + Math.random() * 100) {
        this.directionTimer = 0;
        this.logSpeed = -this.logSpeed;
      }
    }

    // Active blade throwing animation & collision
    if (this.activeThrowBlade && this.activeThrowBlade.throwing) {
      this.activeThrowBlade.y -= this.activeThrowBlade.speed;

      const logCenterY = this.logicalHeight * 0.35;
      const logRadius = 60;
      const bladeHitY = logCenterY + logRadius;

      if (this.activeThrowBlade.y <= bladeHitY) {
        // Check collision with embedded blades
        const hitAngle = Math.PI / 2 - this.logAngle; // Bottom hit angle normalized
        const hitAngleNorm = ((hitAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        let hit = false;
        const minGapAngle = 0.25;

        for (const b of this.embeddedBlades) {
          const bAngleNorm = ((b.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const diff = Math.abs(bAngleNorm - hitAngleNorm);
          const angleDiff = Math.min(diff, Math.PI * 2 - diff);

          if (angleDiff < minGapAngle) {
            hit = true;
            break;
          }
        }

        if (hit) {
          // Collision! Game Over
          this.isRunning = false;
          storageService.triggerHaptic('error');
          audioService.playSfx('gameover');
          this.onGameOver(this.score);
          return;
        }

        // Successfully embedded!
        this.embeddedBlades.push({ angle: hitAngleNorm });
        this.remainingBlades--;
        this.score += 100;
        this.onScoreUpdate(this.score);
        storageService.triggerHaptic('light');
        audioService.playSfx('powerup');

        // Reset blade thrower
        this.activeThrowBlade = {
          y: this.logicalHeight - 100,
          speed: 0,
          throwing: false
        };

        // Level Complete check
        if (this.remainingBlades <= 0) {
          if (this.level < 100) {
            this.level++;
            storageService.saveGameState('blade-master', {
              unlockedLevels: this.level,
              highScore: this.score
            });
            storageService.triggerHaptic('success');
            audioService.playSfx('win');
            this.setupLevel(this.level);
          }
        }
      }
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    // Background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`BLADES REMAINING: ${this.remainingBlades}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Target Log
    const centerX = width / 2;
    const centerY = height * 0.35;
    const radius = 65;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.logAngle);

    // Draw main rotating log/wheel
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Center core
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw embedded blades
    for (const b of this.embeddedBlades) {
      this.ctx.save();
      this.ctx.rotate(b.angle);

      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.beginPath();
      this.ctx.moveTo(radius - 5, -4);
      this.ctx.lineTo(radius + 40, 0);
      this.ctx.lineTo(radius - 5, 4);
      this.ctx.closePath();
      this.ctx.fill();

      // Blade handle
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillRect(radius + 35, -6, 12, 12);

      this.ctx.restore();
    }

    this.ctx.restore();

    // Draw Active Throw Blade
    if (this.activeThrowBlade) {
      const bladeY = this.activeThrowBlade.y;
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 5, bladeY);
      this.ctx.lineTo(centerX, bladeY - 40);
      this.ctx.lineTo(centerX + 5, bladeY);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillRect(centerX - 6, bladeY, 12, 20);
    }
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
