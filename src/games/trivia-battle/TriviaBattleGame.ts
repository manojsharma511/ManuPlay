import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

interface TriviaQuestion {
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    category: 'Gaming',
    question: 'Which iconic blue hero is known as "The Blue Blur"?',
    options: ['Sonic the Hedgehog', 'Mega Man', 'Mario', 'Pac-Man'],
    correctIndex: 0
  },
  {
    category: 'Cricket',
    question: 'How many overs are bowled in a standard Twenty20 (T20) match per side?',
    options: ['10 Overs', '20 Overs', '50 Overs', '100 Balls'],
    correctIndex: 1
  },
  {
    category: 'Technology',
    question: 'What does "HTML" stand for in web development?',
    options: ['HyperText Markup Language', 'High Tech Machine Logic', 'Hyperlink Test Mode Language', 'Hosted Text Management Layer'],
    correctIndex: 0
  },
  {
    category: 'Science',
    question: 'Which chemical element has the atomic symbol "Au"?',
    options: ['Silver', 'Gold', 'Aluminum', 'Copper'],
    correctIndex: 1
  },
  {
    category: 'General Knowledge',
    question: 'Which planet is known as the "Red Planet" in our solar system?',
    options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
    correctIndex: 2
  }
];

export class TriviaBattleGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private onGameOver: (score: number) => void;
  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private currentQuestionIndex = 0;
  private score = 0;
  private streak = 0;
  private timer = 10;
  private timerInterval: any = null;
  private selectedOption: number | null = null;
  private showAnswerFeedback = false;

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
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);

    this.isRunning = true;
    this.isPaused = false;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.streak = 0;

    this.startQuestionTimer();
    this.render();
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 800;
      const height = parent.clientHeight || 500;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      if (this.ctx) {
        this.ctx.scale(dpr, dpr);
      }
      this.render();
    }
  };

  private get logicalWidth(): number {
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 800;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 500;
  }

  public pause() {
    this.isPaused = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  public resume() {
    this.isPaused = false;
    this.startQuestionTimer();
    this.render();
  }

  public destroy() {
    this.isRunning = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
    window.removeEventListener('resize', this.resize);
  }

  private startQuestionTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timer = 10;

    this.timerInterval = setInterval(() => {
      if (this.isPaused || !this.isRunning) return;
      this.timer--;
      if (this.timer <= 0) {
        this.handleOptionClick(-1); // Timeout
      } else {
        this.render();
      }
    }, 1000);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || this.showAnswerFeedback) return;
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = this.logicalWidth;
    const boxW = Math.min(600, w - 40);
    const startX = (w - boxW) / 2;
    const startY = 220;
    const optionH = 50;

    for (let i = 0; i < 4; i++) {
      const optY = startY + i * 62;
      if (x >= startX && x <= startX + boxW && y >= optY && y <= optY + optionH) {
        this.handleOptionClick(i);
        break;
      }
    }
  };

  private handleOptionClick(optIndex: number) {
    if (this.showAnswerFeedback) return;
    this.selectedOption = optIndex;
    this.showAnswerFeedback = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const q = TRIVIA_QUESTIONS[this.currentQuestionIndex];
    const isCorrect = optIndex === q.correctIndex;

    if (isCorrect) {
      this.streak++;
      const points = 500 + this.streak * 150 + this.timer * 50;
      this.score += points;
      audioService.playCoin();
      storageService.triggerHaptic('success');
    } else {
      this.streak = 0;
      audioService.playExplosion();
      storageService.triggerHaptic('error');
    }

    this.onScoreUpdate(this.score);
    this.render();

    setTimeout(() => {
      this.showAnswerFeedback = false;
      this.selectedOption = null;
      this.currentQuestionIndex++;

      if (this.currentQuestionIndex >= TRIVIA_QUESTIONS.length) {
        audioService.playGameOver();
        this.destroy();
        this.onGameOver(this.score);
      } else {
        this.startQuestionTimer();
        this.render();
      }
    }, 1500);
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const q = TRIVIA_QUESTIONS[this.currentQuestionIndex];
    if (!q) return;

    // Header info
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`CATEGORY: ${q.category.toUpperCase()} • QUESTION ${this.currentQuestionIndex + 1}/${TRIVIA_QUESTIONS.length}`, 30, 40);

    // Timer Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(30, 50, w - 60, 8);
    ctx.fillStyle = this.timer > 3 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(30, 50, ((w - 60) * this.timer) / 10, 8);

    // Question Text Box
    ctx.fillStyle = '#1e293b';
    const boxW = Math.min(600, w - 40);
    const startX = (w - boxW) / 2;
    ctx.beginPath();
    ctx.roundRect(startX, 80, boxW, 110, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(q.question, w / 2, 135, boxW - 40);

    // Render Options
    const startY = 220;
    const optionH = 50;

    q.options.forEach((optText, i) => {
      const optY = startY + i * 62;
      ctx.save();

      let bg = '#1e293b';
      let border = '#334155';

      if (this.showAnswerFeedback) {
        if (i === q.correctIndex) {
          bg = '#065f46';
          border = '#10b981';
        } else if (i === this.selectedOption) {
          bg = '#991b1b';
          border = '#ef4444';
        }
      }

      ctx.fillStyle = bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX, optY, boxW, optionH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${String.fromCharCode(65 + i)}. ${optText}`, startX + 20, optY + optionH / 2);
      ctx.restore();
    });

    // Score & Streak HUD
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}  |  🔥 STREAK: ${this.streak}x`, 30, h - 30);
  }
}
