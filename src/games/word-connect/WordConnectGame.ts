import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface WordLevelData {
  letters: string[];
  targetWords: string[];
}

const LEVEL_WORDS_DATABASE: WordLevelData[] = [
  { letters: ['C', 'A', 'T'], targetWords: ['CAT', 'ACT'] },
  { letters: ['D', 'O', 'G'], targetWords: ['DOG', 'GOD'] },
  { letters: ['S', 'U', 'N'], targetWords: ['SUN'] },
  { letters: ['P', 'E', 'N'], targetWords: ['PEN'] },
  { letters: ['B', 'A', 'L', 'L'], targetWords: ['BALL', 'ALL', 'LAB'] },
  { letters: ['G', 'A', 'M', 'E'], targetWords: ['GAME', 'MAGE', 'AGE'] },
  { letters: ['P', 'L', 'A', 'Y'], targetWords: ['PLAY', 'LAY', 'PAY'] },
  { letters: ['C', 'O', 'D', 'E'], targetWords: ['CODE', 'DECO', 'DOC'] },
  { letters: ['F', 'I', 'R', 'E'], targetWords: ['FIRE', 'RIFE', 'FIR'] },
  { letters: ['S', 'T', 'A', 'R'], targetWords: ['STAR', 'ARTS', 'RAT', 'ART'] }
];

export class WordConnectGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;
  private isRunning = false;
  private isPaused = false;

  public level = 1;
  public score = 0;

  private letters: { char: string; x: number; y: number; selected: boolean }[] = [];
  private targetWords: { word: string; found: boolean }[] = [];
  private currentSelection: string[] = [];

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

    storageService.loadGameState('word-connect').then(save => {
      if (save?.unlockedLevels) {
        this.level = Math.min(save.unlockedLevels, 100);
      }
      this.setupLevel(this.level);
    });

    this.setupControls();
    this.isRunning = true;
    this.isPaused = false;

    audioService.startSynthMusic('puzzle');
    ManuPlayGameSDK.gameStarted('word-connect');
    this.loop();
  }

  private setupLevel(lvl: number) {
    this.level = lvl;
    this.currentSelection = [];

    const dbIdx = (lvl - 1) % LEVEL_WORDS_DATABASE.length;
    const data = LEVEL_WORDS_DATABASE[dbIdx];

    this.targetWords = data.targetWords.map(w => ({ word: w, found: false }));

    // Position letters in a circle at the bottom
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const centerX = width / 2;
    const centerY = height - 140;
    const radius = 75;

    const count = data.letters.length;
    this.letters = data.letters.map((char, idx) => {
      const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
      return {
        char,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        selected: false
      };
    });
  }

  private setupControls() {
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
      this.canvas.addEventListener('pointerup', this.handlePointerUp);
    }
  }

  private removeControls() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused) return;
    this.checkLetterHit(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || this.currentSelection.length === 0) return;
    this.checkLetterHit(e);
  };

  private handlePointerUp = () => {
    if (!this.isRunning || this.isPaused || this.currentSelection.length === 0) return;
    this.submitWord();
  };

  private checkLetterHit(e: PointerEvent) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const l of this.letters) {
      const dist = Math.hypot(x - l.x, y - l.y);
      if (dist < 26 && !l.selected) {
        l.selected = true;
        this.currentSelection.push(l.char);
        storageService.triggerHaptic('light');
        audioService.playSfx('pop');
        break;
      }
    }
  }

  private submitWord() {
    const word = this.currentSelection.join('');
    this.letters.forEach(l => l.selected = false);
    this.currentSelection = [];

    const target = this.targetWords.find(t => t.word === word);
    if (target && !target.found) {
      target.found = true;
      this.score += word.length * 100;
      this.onScoreUpdate(this.score);
      storageService.triggerHaptic('medium');
      audioService.playSfx('powerup');

      // Check level complete
      if (this.targetWords.every(t => t.found)) {
        if (this.level < 100) {
          this.level++;
          storageService.saveGameState('word-connect', {
            unlockedLevels: this.level,
            highScore: this.score
          });
          storageService.triggerHaptic('success');
          audioService.playSfx('win');
          this.setupLevel(this.level);
        }
      }
    } else {
      audioService.playSfx('pop');
      if (this.level > 50) {
        this.onGameOver(this.score);
      }
    }
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
      this.render();
    }
    this.animId = requestAnimationFrame(this.loop);
  };

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

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, width - 20, 35);

    // Draw Target Word Boxes at Top
    const startY = 80;
    this.targetWords.forEach((tw, idx) => {
      const boxY = startY + idx * 45;
      const boxWidth = tw.word.length * 36;
      const boxX = (width - boxWidth) / 2;

      for (let i = 0; i < tw.word.length; i++) {
        const bx = boxX + i * 36;
        this.ctx!.fillStyle = tw.found ? '#10b981' : '#1e293b';
        this.ctx!.fillRect(bx, boxY, 30, 36);
        this.ctx!.strokeStyle = '#38bdf8';
        this.ctx!.lineWidth = 2;
        this.ctx!.strokeRect(bx, boxY, 30, 36);

        if (tw.found) {
          this.ctx!.fillStyle = '#ffffff';
          this.ctx!.font = '900 20px sans-serif';
          this.ctx!.textAlign = 'center';
          this.ctx!.textBaseline = 'middle';
          this.ctx!.fillText(tw.word[i], bx + 15, boxY + 18);
        }
      }
    });

    // Current Selection Text Banner
    const currentWord = this.currentSelection.join('');
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.font = '900 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(currentWord || 'SWIPE LETTERS', width / 2, height - 240);

    // Draw Wheel Base
    const centerX = width / 2;
    const centerY = height - 140;
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 95, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw Connecting Lines for Selected Letters
    if (this.letters.some(l => l.selected)) {
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      let first = true;
      this.letters.forEach(l => {
        if (l.selected) {
          if (first) {
            this.ctx!.moveTo(l.x, l.y);
            first = false;
          } else {
            this.ctx!.lineTo(l.x, l.y);
          }
        }
      });
      this.ctx.stroke();
    }

    // Draw Letter Nodes
    this.letters.forEach(l => {
      this.ctx!.fillStyle = l.selected ? '#00f0ff' : '#334155';
      this.ctx!.beginPath();
      this.ctx!.arc(l.x, l.y, 24, 0, Math.PI * 2);
      this.ctx!.fill();

      this.ctx!.fillStyle = l.selected ? '#0f172a' : '#ffffff';
      this.ctx!.font = '900 22px sans-serif';
      this.ctx!.textAlign = 'center';
      this.ctx!.textBaseline = 'middle';
      this.ctx!.fillText(l.char, l.x, l.y);
    });
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
