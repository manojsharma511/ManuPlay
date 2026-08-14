import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface MemoryCard {
  id: number;
  icon: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const ICONS = [
  { icon: '⚡', color: '#00f0ff' },
  { icon: '🚀', color: '#ff007f' },
  { icon: '🛡️', color: '#9900ff' },
  { icon: '⭐', color: '#ffaa00' },
  { icon: '🔥', color: '#ff3300' },
  { icon: '💎', color: '#00ff88' },
  { icon: '👾', color: '#e000ff' },
  { icon: '🏆', color: '#ffd700' }
];

export class CyberMemoryGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  // Grid & Cards
  private cards: MemoryCard[] = [];
  private flippedIndices: number[] = [];
  private isChecking = false;
  private particles: Particle[] = [];

  // Game stats
  private score = 0;
  private moves = 0;
  private matchesLeft = 8;
  private timeRemaining = 60;
  private timerInterval: any = null;

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
    this.setupGrid();

    this.score = 0;
    this.moves = 0;
    this.matchesLeft = 8;
    this.timeRemaining = 60;
    this.flippedIndices = [];
    this.isChecking = false;
    this.particles = [];

    this.isRunning = true;
    this.isPaused = false;

    this.setupTouch();

    this.timerInterval = setInterval(() => {
      if (this.isRunning && !this.isPaused) {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.endGame();
        }
      }
    }, 1000);

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('cyber-memory');
    this.loop();
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 400;
      const height = parent.clientHeight || 650;

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
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 650;
  }

  private setupGrid() {
    const pairs = [...ICONS, ...ICONS];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    this.cards = pairs.map((item, idx) => ({
      id: idx,
      icon: item.icon,
      color: item.color,
      isFlipped: false,
      isMatched: false
    }));
  }

  private handleTouchClick = (e: MouseEvent | TouchEvent) => {
    if (!this.canvas || !this.isRunning || this.isPaused || this.isChecking) return;
    const rect = this.canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const gridOriginX = 20;
    const gridOriginY = 100;
    const cardW = (this.logicalWidth - 60) / 4;
    const cardH = cardW * 1.2;

    for (let i = 0; i < this.cards.length; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = gridOriginX + col * (cardW + 8);
      const y = gridOriginY + row * (cardH + 8);

      if (clickX >= x && clickX <= x + cardW && clickY >= y && clickY <= y + cardH) {
        const card = this.cards[i];
        if (!card.isFlipped && !card.isMatched) {
          card.isFlipped = true;
          this.flippedIndices.push(i);
          audioService.playClick();
          storageService.triggerHaptic('light');

          if (this.flippedIndices.length === 2) {
            this.moves++;
            this.checkMatch(x + cardW / 2, y + cardH / 2);
          }
        }
        break;
      }
    }
  };

  private setupTouch() {
    if (!this.canvas) return;
    this.canvas.addEventListener('click', this.handleTouchClick);
    this.canvas.addEventListener('touchstart', this.handleTouchClick, { passive: true });
  }

  private checkMatch(lastX: number, lastY: number) {
    this.isChecking = true;
    const [idx1, idx2] = this.flippedIndices;
    const card1 = this.cards[idx1];
    const card2 = this.cards[idx2];

    if (card1.icon === card2.icon) {
      setTimeout(() => {
        card1.isMatched = true;
        card2.isMatched = true;
        this.flippedIndices = [];
        this.isChecking = false;
        this.matchesLeft--;

        const bonus = Math.max(50, 300 - this.moves * 10);
        this.score += bonus;
        this.onScoreUpdate(this.score);

        audioService.playCoin();
        storageService.triggerHaptic('success');

        for (let k = 0; k < 12; k++) {
          this.particles.push({
            x: lastX,
            y: lastY,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: card1.color,
            life: 0.6
          });
        }

        if (this.matchesLeft <= 0) {
          this.score += this.timeRemaining * 50; // Bonus time remaining
          this.onScoreUpdate(this.score);
          this.endGame();
        }
      }, 250);
    } else {
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedIndices = [];
        this.isChecking = false;
      }, 700);
    }
  }

  private endGame() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    audioService.playGameOver();
    storageService.triggerHaptic('error');
    ManuPlayGameSDK.gameCompleted('cyber-memory', this.score);
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
    audioService.startSynthMusic('puzzle');
    this.loop();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleTouchClick);
      this.canvas.removeEventListener('touchstart', this.handleTouchClick);
    }
    window.removeEventListener('resize', this.resize);
    audioService.stopSynthMusic();
  }

  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * 0.016;
      pt.y += pt.vy * 0.016;
      pt.life -= 0.016;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    const gridOriginX = 20;
    const gridOriginY = 100;
    const cardW = (w - 60) / 4;
    const cardH = cardW * 1.2;

    this.cards.forEach((card, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = gridOriginX + col * (cardW + 8);
      const y = gridOriginY + row * (cardH + 8);

      ctx.save();
      if (card.isMatched) {
        ctx.globalAlpha = 0.3;
      }

      if (card.isFlipped || card.isMatched) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = card.color;
        ctx.fillStyle = '#161926';
        ctx.strokeStyle = card.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.icon, x + cardW / 2, y + cardH / 2);
      } else {
        ctx.fillStyle = '#1a1e34';
        ctx.strokeStyle = '#2d3454';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00f0ff44';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', x + cardW / 2, y + cardH / 2);
      }
      ctx.restore();
    });

    // Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // HUD
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`⏱️ TIME: ${this.timeRemaining}s   🎯 MOVES: ${this.moves}   🧩 MATCHES: ${8 - this.matchesLeft}/8`, 20, 45);
    ctx.restore();
  }
}
