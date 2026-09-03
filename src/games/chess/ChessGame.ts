import { audioService } from '../../services/AudioService';
import { storageService } from '../../services/StorageService';

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export class ChessGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private onGameOver: (score: number) => void;

  private onScoreUpdate: (score: number) => void;

  private isRunning = false;
  private isPaused = false;

  private board: (ChessPiece | null)[][] = [];
  private turn: PieceColor = 'w';
  private selectedCell: { r: number; c: number } | null = null;
  private validMoves: { r: number; c: number }[] = [];
  private capturedWhite: PieceType[] = [];
  private capturedBlack: PieceType[] = [];
  private score = 0;
  private movesCount = 0;

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

    this.resetBoard();
    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.movesCount = 0;

    this.render();
  }

  private resetBoard() {
    const setup: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup Black pieces
    for (let c = 0; c < 8; c++) {
      this.board[0][c] = { type: setup[c], color: 'b' };
      this.board[1][c] = { type: 'p', color: 'b' };
    }

    // Setup White pieces
    for (let c = 0; c < 8; c++) {
      this.board[6][c] = { type: 'p', color: 'w' };
      this.board[7][c] = { type: setup[c], color: 'w' };
    }

    this.turn = 'w';
    this.selectedCell = null;
    this.validMoves = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
  }

  private resize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth || 600;
      const height = parent.clientHeight || 600;

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
    return this.canvas ? parseFloat(this.canvas.style.width) || this.canvas.width : 600;
  }

  private get logicalHeight(): number {
    return this.canvas ? parseFloat(this.canvas.style.height) || this.canvas.height : 600;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.render();
  }

  public destroy() {
    this.isRunning = false;
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
    window.removeEventListener('resize', this.resize);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.isRunning || this.isPaused || this.turn !== 'w') return;

    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = Math.min(this.logicalWidth, this.logicalHeight) - 40;
    const offsetX = (this.logicalWidth - size) / 2;
    const offsetY = (this.logicalHeight - size) / 2;
    const cellSize = size / 8;

    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      this.onCellClick(row, col);
    }
  };

  private onCellClick(r: number, c: number) {
    if (this.selectedCell) {
      const isValid = this.validMoves.some(m => m.r === r && m.c === c);
      if (isValid) {
        this.makeMove(this.selectedCell.r, this.selectedCell.c, r, c);
        this.selectedCell = null;
        this.validMoves = [];
        return;
      }
    }

    const piece = this.board[r][c];
    if (piece && piece.color === this.turn) {
      this.selectedCell = { r, c };
      this.validMoves = this.calculateValidMoves(r, c);
      audioService.playCoin();
    } else {
      this.selectedCell = null;
      this.validMoves = [];
    }

    this.render();
  }

  private calculateValidMoves(r: number, c: number): { r: number; c: number }[] {
    const piece = this.board[r][c];
    if (!piece) return [];
    const moves: { r: number; c: number }[] = [];

    const addMove = (nr: number, nc: number) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const dest = this.board[nr][nc];
      if (!dest) {
        moves.push({ r: nr, c: nc });
        return true;
      }
      if (dest.color !== piece.color) {
        moves.push({ r: nr, c: nc });
      }
      return false;
    };

    if (piece.type === 'p') {
      const dir = piece.color === 'w' ? -1 : 1;
      if (r + dir >= 0 && r + dir < 8 && !this.board[r + dir][c]) {
        moves.push({ r: r + dir, c });
        if ((piece.color === 'w' && r === 6) || (piece.color === 'b' && r === 1)) {
          if (!this.board[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c });
        }
      }
      // Captures
      [-1, 1].forEach(dc => {
        const dest = this.board[r + dir]?.[c + dc];
        if (dest && dest.color !== piece.color) moves.push({ r: r + dir, c: c + dc });
      });
    } else if (piece.type === 'n') {
      const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      offsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (piece.type === 'k') {
      const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      offsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else {
      const dirs: number[][] = [];
      if (piece.type === 'r' || piece.type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (piece.type === 'b' || piece.type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

      dirs.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (addMove(nr, nc)) {
          nr += dr;
          nc += dc;
        }
      });
    }

    return moves;
  }

  private makeMove(fromR: number, fromC: number, toR: number, toC: number) {
    const piece = this.board[fromR][fromC]!;
    const target = this.board[toR][toC];

    if (target) {
      if (target.color === 'w') this.capturedWhite.push(target.type);
      else this.capturedBlack.push(target.type);
      audioService.playExplosion();
      storageService.triggerHaptic('medium');
      this.score += 200;
    } else {
      audioService.playJump();
      storageService.triggerHaptic('light');
      this.score += 25;
    }

    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;
    this.movesCount++;
    this.onScoreUpdate(this.score);

    // Check if King captured
    if (target?.type === 'k') {
      audioService.playGameOver();
      this.destroy();
      this.onGameOver(this.score + 1000);
      return;
    }

    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.render();

    // AI turn if Black
    if (this.turn === 'b') {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  private makeAIMove() {
    if (!this.isRunning || this.turn !== 'b') return;

    const allMoves: { fromR: number; fromC: number; toR: number; toC: number; isCapture: boolean }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === 'b') {
          const valids = this.calculateValidMoves(r, c);
          valids.forEach(m => {
            allMoves.push({
              fromR: r,
              fromC: c,
              toR: m.r,
              toC: m.c,
              isCapture: !!this.board[m.r][m.c]
            });
          });
        }
      }
    }

    if (allMoves.length === 0) return;

    // Prefer captures
    const captures = allMoves.filter(m => m.isCapture);
    const chosen = captures.length > 0
      ? captures[Math.floor(Math.random() * captures.length)]
      : allMoves[Math.floor(Math.random() * allMoves.length)];

    this.makeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC);
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const size = Math.min(w, h) - 40;
    const offsetX = (w - size) / 2;
    const offsetY = (h - size) / 2;
    const cellSize = size / 8;

    // Board outline & shadow
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(offsetX - 6, offsetY - 6, size + 12, size + 12);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? '#cbd5e1' : '#334155';

        if (this.selectedCell?.r === r && this.selectedCell?.c === c) {
          ctx.fillStyle = '#38bdf8';
        }

        ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);

        // Highlight valid move target dots
        if (this.validMoves.some(m => m.r === r && m.c === c)) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.beginPath();
          ctx.arc(
            offsetX + c * cellSize + cellSize / 2,
            offsetY + r * cellSize + cellSize / 2,
            cellSize / 5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Draw piece text/symbol
        const piece = this.board[r][c];
        if (piece) {
          ctx.fillStyle = piece.color === 'w' ? '#f8fafc' : '#0f172a';
          ctx.font = `bold ${cellSize * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const symbols: Record<PieceType, string> = {
            k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
          };
          ctx.fillText(
            symbols[piece.type],
            offsetX + c * cellSize + cellSize / 2,
            offsetY + r * cellSize + cellSize / 2
          );
        }
      }
    }

    // Turn HUD text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.turn === 'w' ? 'YOUR TURN (WHITE)' : 'OPPONENT THINKING (BLACK)...',
      w / 2,
      offsetY / 2
    );
  }
}
