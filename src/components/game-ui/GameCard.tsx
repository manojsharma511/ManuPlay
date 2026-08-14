import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Play, Heart, Zap, Sparkles, ShieldAlert, Grid, Rocket } from 'lucide-react';
import type { GameDefinition } from '../../games/types';
import { storageService } from '../../services/StorageService';

const ICON_MAP: Record<string, any> = {
  Zap, Sparkles, ShieldAlert, Grid, Rocket
};

export const GameCard: React.FC<{ game: GameDefinition }> = ({ game }) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(() => storageService.isFavorite(game.id));
  const IconComponent = ICON_MAP[game.iconName] || Zap;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = storageService.toggleFavorite(game.id);
    setIsFav(updated);
    storageService.triggerHaptic('light');
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/game/${game.slug}`);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
      
      {/* Thumbnail Aspect Box */}
      <Link to={`/game/${game.slug}`} className="relative aspect-[4/3] w-full overflow-hidden block">
        {/* Gradient Artwork */}
        <div
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 text-center transition-transform duration-500 group-hover:scale-105"
          style={{ background: game.thumbnailBg }}
        >
          <div className="p-3 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 text-white shadow-xl mb-1">
            <IconComponent className="w-8 h-8" />
          </div>
          <span className="font-black text-lg text-white drop-shadow-md tracking-wide max-w-[90%] truncate">
            {game.title}
          </span>
        </div>

        {/* Overlay Dark Vignette & Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {game.isNew && (
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-cyan-400 text-slate-950 shadow-md uppercase tracking-wider">
                NEW
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-950/70 text-slate-200 backdrop-blur-md border border-slate-700/50">
              {game.category}
            </span>
          </div>

          {/* Favorite Heart Button */}
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-md border transition-all active:scale-90 pointer-events-auto min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isFav
                ? 'bg-pink-500/20 border-pink-500/50 text-pink-500'
                : 'bg-slate-950/60 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500' : ''}`} />
          </button>
        </div>

        {/* Play CTA Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/50 backdrop-blur-[2px]">
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/40 transform scale-75 group-hover:scale-100 transition-transform duration-300"
          >
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </button>
        </div>
      </Link>

      {/* Card Content Footer */}
      <div className="p-3 flex items-center justify-between bg-slate-900/90 border-t border-slate-800/60">
        <div className="flex flex-col min-w-0 pr-2">
          <Link to={`/game/${game.slug}`} className="font-bold text-sm text-white hover:text-cyan-400 transition-colors truncate">
            {game.title}
          </Link>
          <span className="text-[11px] text-slate-400 truncate">
            {(game.plays / 1000).toFixed(1)}k plays
          </span>
        </div>

        {/* Rating Star */}
        <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800 text-xs font-bold text-amber-400 shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{game.rating}</span>
        </div>
      </div>

    </div>
  );
};
