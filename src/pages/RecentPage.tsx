import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { storageService } from '../services/StorageService';
import { gameService } from '../services/GameService';
import type { GameDefinition } from '../games/types';
import { GameGrid } from '../components/game-ui/GameGrid';
import { EmptyState } from '../components/common/EmptyState';

export const RecentPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentGames, setRecentGames] = useState<GameDefinition[]>([]);

  useEffect(() => {
    const recentIds = storageService.getRecentlyPlayed();
    const games = recentIds
      .map(id => gameService.getGameBySlug(id))
      .filter((g): g is GameDefinition => g !== undefined);
    setRecentGames(games);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Recently Played</h1>
          <p className="text-xs sm:text-sm text-slate-400">Jump right back into games you've recently enjoyed.</p>
        </div>
      </div>

      {/* Grid or Empty State */}
      {recentGames.length > 0 ? (
        <GameGrid games={recentGames} />
      ) : (
        <EmptyState
          title="No Recently Played Games"
          description="Once you start playing games on ManuPlay, your history will appear here for instant continue."
          actionText="Start Playing"
          onAction={() => navigate('/')}
          icon={<History className="w-8 h-8 text-cyan-400" />}
        />
      )}

    </div>
  );
};
