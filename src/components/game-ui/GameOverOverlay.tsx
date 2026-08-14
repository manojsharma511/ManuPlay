import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Home, Sparkles, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { storageService } from '../../services/StorageService';
import { gameService } from '../../services/GameService';
import type { GameDefinition } from '../../games/types';

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
  const navigate = useNavigate();
  const [highScore, setHighScore] = useState(score);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [recommendedGames, setRecommendedGames] = useState<GameDefinition[]>([]);

  useEffect(() => {
    const processScore = async () => {
      const state = await storageService.loadGameState(gameId);
      const prevBest = state?.highScore || 0;
      const calculatedXp = Math.round(score * 0.1) + 50;
      setXpEarned(calculatedXp);

      if (score > prevBest) {
        setIsNewHigh(true);
        setHighScore(score);
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {
          // Confetti fallback
        }
      } else {
        setHighScore(prevBest);
      }
      await storageService.saveGameState(gameId, { highScore: Math.max(score, prevBest) });

      // Fetch recommended next games
      const nextGames = gameService.getRelatedGames(gameId, 3);
      setRecommendedGames(nextGames);
    };

    processScore();
  }, [score, gameId]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn select-none overflow-y-auto">
      
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 text-center shadow-2xl shadow-cyan-500/10 space-y-4 animate-scaleUp my-auto">
        
        <div>
          {isNewHigh && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-2 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" /> NEW PERSONAL BEST!
            </div>
          )}
          <h2 className="text-3xl font-black text-white tracking-wider uppercase">
            GAME OVER
          </h2>
        </div>

        {/* Score & XP Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YOUR SCORE</span>
            <span className="text-xl font-black text-cyan-400 mt-0.5">{score.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> BEST SCORE
            </span>
            <span className="text-xl font-black text-amber-400 mt-0.5">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* XP Reward Badge */}
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
          <Zap className="w-4 h-4 fill-purple-300" />
          <span>REWARD: +{xpEarned} XP</span>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth onClick={onRestart}>
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN
          </Button>

          <Button variant="secondary" size="md" fullWidth onClick={onMoreGames}>
            <Sparkles className="w-4 h-4" /> MORE GAMES
          </Button>

          <Button variant="ghost" size="sm" fullWidth onClick={onHome}>
            <Home className="w-4 h-4" /> EXIT TO HOME
          </Button>
        </div>

        {/* Play Next Recommendations */}
        {recommendedGames.length > 0 && (
          <div className="pt-2 border-t border-slate-800 text-left">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 block">
              PLAY NEXT
            </span>
            <div className="grid grid-cols-3 gap-2">
              {recommendedGames.map(g => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/game/${g.slug}/play`)}
                  className="flex flex-col items-center p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 active:scale-95 transition-all text-center cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs mb-1" style={{ background: g.thumbnailBg }}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-cyan-400 truncate w-full">
                    {g.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
