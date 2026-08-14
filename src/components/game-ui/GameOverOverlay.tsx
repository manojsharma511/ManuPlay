import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Home, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { storageService } from '../../services/StorageService';

interface GameOverOverlayProps {
  score: number;
  gameId: string;
  onRestart: () => void;
  onMoreGames: () => void;
  onHome: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  gameId,
  onRestart,
  onMoreGames,
  onHome
}) => {
  const [highScore, setHighScore] = useState(score);
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => {
    const processScore = async () => {
      const state = await storageService.loadGameState(gameId);
      const prevBest = state?.highScore || 0;
      if (score > prevBest) {
        setIsNewHigh(true);
        setHighScore(score);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // Confetti fallback
        }
      } else {
        setHighScore(prevBest);
      }
      await storageService.saveGameState(gameId, { highScore: Math.max(score, prevBest) });
    };
    processScore();
  }, [score, gameId]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn select-none">
      
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center shadow-2xl shadow-cyan-500/10 space-y-6 animate-scaleUp">
        
        <div>
          {isNewHigh && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-2 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" /> NEW HIGH SCORE!
            </div>
          )}
          <h2 className="text-3xl font-black text-white tracking-wider uppercase">
            GAME OVER
          </h2>
        </div>

        {/* Score Display Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YOUR SCORE</span>
            <span className="text-2xl font-black text-cyan-400 mt-1">{score.toLocaleString()}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> BEST SCORE
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-3">
          <Button variant="primary" size="lg" fullWidth onClick={onRestart}>
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN
          </Button>

          <Button variant="secondary" size="md" fullWidth onClick={onMoreGames}>
            <Sparkles className="w-4 h-4" /> MORE GAMES
          </Button>

          <Button variant="ghost" size="md" fullWidth onClick={onHome}>
            <Home className="w-4 h-4" /> EXIT HOME
          </Button>
        </div>

      </div>

    </div>
  );
};
