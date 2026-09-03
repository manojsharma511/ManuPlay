import React from 'react';
import { Trophy } from 'lucide-react';
import { gameService } from '../services/GameService';
import { progressionService } from '../services/ProgressionService';
import { SEO } from '../components/common/SEO';

export const LeaderboardsPage: React.FC = () => {
  const games = gameService.getAllGames();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      <SEO
        title="High Score Leaderboards"
        description="Track your personal best game scores on ManuPlay."
        path="/leaderboards"
        noindex={true}
      />
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Personal Best Records</h1>
          <p className="text-xs sm:text-sm text-slate-400">Track your local high scores and game mastery across all titles.</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>GAME TITLE</span>
          <div className="flex items-center gap-8">
            <span>MASTERY</span>
            <span>HIGH SCORE</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {games.map((game, i) => {
            const mastery = progressionService.getGameMastery(game.id);
            const badgeNames = ['Unranked', 'Bronze 🥉', 'Silver 🥈', 'Gold 🥇', 'Diamond 💎'];

            return (
              <div key={game.id} className="p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xs text-slate-500 w-5">#{i + 1}</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{game.title}</h4>
                    <span className="text-[11px] text-slate-400">{game.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-8">
                  <span className="text-xs font-bold text-cyan-400">{badgeNames[mastery.level]}</span>
                  <span className="font-mono font-black text-sm text-amber-400 min-w-[70px] text-right">
                    {mastery.highScore.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
