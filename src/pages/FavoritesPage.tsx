import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { storageService } from '../services/StorageService';
import { gameService } from '../services/GameService';
import type { GameDefinition } from '../games/types';
import { GameGrid } from '../components/game-ui/GameGrid';
import { EmptyState } from '../components/common/EmptyState';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favGames, setFavGames] = useState<GameDefinition[]>([]);

  useEffect(() => {
    const loadFavs = () => {
      const favIds = storageService.getFavorites();
      const games = gameService.getAllGames().filter(g => favIds.includes(g.id));
      setFavGames(games);
    };
    loadFavs();
    window.addEventListener('storage', loadFavs);
    return () => window.removeEventListener('storage', loadFavs);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
          <Heart className="w-8 h-8 fill-pink-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">My Favorites</h1>
          <p className="text-xs sm:text-sm text-slate-400">Quick access to your saved favorite games.</p>
        </div>
      </div>

      {/* Grid or Empty State */}
      {favGames.length > 0 ? (
        <GameGrid games={favGames} />
      ) : (
        <EmptyState
          title="Your favorite games will appear here"
          description="Tap the heart icon on any game card to add it to your personal favorites collection."
          actionText="EXPLORE GAMES"
          onAction={() => navigate('/games')}
          icon={<Heart className="w-8 h-8 text-pink-500 fill-pink-500" />}
        />
      )}

    </div>
  );
};
