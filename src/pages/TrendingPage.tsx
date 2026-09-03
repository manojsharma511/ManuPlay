import React from 'react';
import { Flame } from 'lucide-react';
import { gameService } from '../services/GameService';
import { GameGrid } from '../components/game-ui/GameGrid';

import { SEO } from '../components/common/SEO';

export const TrendingPage: React.FC = () => {
  const trendingGames = gameService.getGames({ trendingOnly: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title="Trending Games — Top Played Online Games"
        description="Discover the most played and trending free online games on ManuPlay today. Play high speed browser games instantly on mobile and desktop."
        path="/trending"
      />
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Flame className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Trending Games</h1>
          <p className="text-xs sm:text-sm text-slate-400">The most popular and played games on ManuPlay right now.</p>
        </div>
      </div>

      <GameGrid games={trendingGames} />
    </div>
  );
};
