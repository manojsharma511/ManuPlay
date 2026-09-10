import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface Node {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  isHazard: boolean;
  life: number;
  maxLife: number;
}

export class ReflexTapGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;
  private targetTaps = 20;
  private currentTaps = 0;

  private nodes: Node[] = [];
  private spawnTimer = 0;

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

    storageService.loadGameState('reflex-tap').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('arcade');
    ManuPlayGameSDK.gameStarted('reflex-tap');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.score = 0;
    this.currentTaps = 0;
    this.targetTaps = 15 + lvl * 2;
    this.nodes = [];
    this.spawnTimer = 0;
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const dist = Math.hypot(x - n.x, y - n.y);
      if (dist <= n.radius + 10) {
        if (n.isHazard) {
          // Tapped hazard! Game over
          this.handleGameOver();
          return;
        } else {
          // Success tap
          this.nodes.splice(i, 1);
          this.currentTaps++;
          this.score += Math.floor(n.life * 100) + 50;
          this.onScoreUpdate(this.score);
          storageService.triggerHaptic('medium');
          audioService.playSfx('powerup');

          // Level complete check
          if (this.currentTaps >= this.targetTaps) {
            if (this.level < 100) {
              this.level++;
              storageService.saveGameState('reflex-tap', {
                unlockedLevels: this.level,
                highScore: this.score
              });
              storageService.triggerHaptic('success');
              audioService.playSfx('win');
              this.setupLevel(this.level);
            }
          }
          break;
        }
      }
    }
  };

  private spawnNode() {
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    const isHazard = this.level > 3 && Math.random() < 0.25;
    const maxLife = Math.max(40, 100 - this.level * 0.8);

    this.nodes.push({
      id: Date.now() + Math.random(),
      x: 60 + Math.random() * (width - 120),
      y: 120 + Math.random() * (height - 200),
      radius: Math.max(25, 40 - Math.floor(this.level / 5)),
      active: true,
      isHazard,
      life: maxLife,
      maxLife
    });
  }

  private handleGameOver() {
    this.isRunning = false;
    storageService.triggerHaptic('error');
    audioService.playSfx('gameover');
    this.onGameOver(this.score);
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
    this.spawnTimer++;
    if (this.spawnTimer > Math.max(20, 60 - this.level)) {
      this.spawnTimer = 0;
      this.spawnNode();
    }

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      n.life--;
      if (n.life <= 0) {
        this.nodes.splice(i, 1);
        if (!n.isHazard) {
          // Expired active target -> Miss penalty / Game Over on higher levels
          if (this.level > 10) {
            this.handleGameOver();
            return;
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
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // HUD Header
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = '900 18px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LEVEL ${this.level} / 100`, 20, 35);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.fillText(`TAPS: ${this.currentTaps} / ${this.targetTaps}`, 20, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Nodes
    for (const n of this.nodes) {
      const lifeRatio = n.life / n.maxLife;

      this.ctx.fillStyle = n.isHazard ? '#ef4444' : '#00f0ff';
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Outer shrink ring for timer
      this.ctx.strokeStyle = n.isHazard ? '#dc2626' : '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.radius * lifeRatio + 4, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(n.isHazard ? '⚠️' : '⚡', n.x, n.y);
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
