import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Play, Heart, Zap, Sparkles, ShieldAlert, Grid, Rocket, Flame, Trophy, Brain, Smile, Swords, Puzzle } from 'lucide-react';
import type { GameDefinition } from '../../games/types';
import { storageService } from '../../services/StorageService';

const ICON_MAP: Record<string, any> = {
  Zap, Sparkles, ShieldAlert, Grid, Rocket, Flame, Trophy, Brain, Smile, Swords, Puzzle
};

export const GameCard: React.FC<{ game: GameDefinition }> = ({ game }) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(() => storageService.isFavorite(game.id));
  const IconComponent = ICON_MAP[game.iconName] || Gamepad2Icon;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = storageService.toggleFavorite(game.id);
    setIsFav(updated);
    storageService.triggerHaptic('light');
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/games/${game.slug}`);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/15 transition-all duration-300 active:scale-[0.98]">
      
      {/* Thumbnail Aspect Box */}
      <Link to={`/games/${game.slug}`} className="relative aspect-[4/3] w-full overflow-hidden block">
        {/* Cover Image or Dynamic AI Gradient Artwork */}
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-between p-3.5 text-center transition-transform duration-500 group-hover:scale-105 select-none"
            style={{ background: game.thumbnailBg || 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}
          >
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            <div className="w-full flex justify-end">
              <span className="text-[10px] font-black text-white/90 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 uppercase tracking-widest">
                {game.category}
              </span>
            </div>

            <div className="my-auto flex flex-col items-center gap-1.5 z-10">
              <div 
                className="p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/20 text-white shadow-2xl group-hover:scale-110 transition-transform"
                style={{ color: game.accentColor || '#00f0ff' }}
              >
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <span className="font-black text-base sm:text-lg text-white drop-shadow-md tracking-tight line-clamp-1 max-w-[90%]">
                {game.title}
              </span>
            </div>

            <div className="w-full flex items-center justify-between z-10 text-[10px] font-bold text-white/80">
              <span>{game.orientation === 'landscape' ? '📺 Landscape' : '📱 Portrait'}</span>
              <span>★ {game.rating}</span>
            </div>
          </div>
        )}

        {/* Dynamic Vignette Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {game.isNew && (
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-cyan-400 text-slate-950 shadow-md uppercase tracking-wider">
                NEW
              </span>
            )}
            {game.trending && !game.isNew && (
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 fill-slate-950" /> HOT
              </span>
            )}
          </div>

          {/* Favorite Heart Button */}
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-md border transition-all active:scale-90 pointer-events-auto min-w-[34px] min-h-[34px] flex items-center justify-center ${
              isFav
                ? 'bg-pink-500/30 border-pink-500/60 text-pink-400 shadow-lg shadow-pink-500/20'
                : 'bg-slate-950/70 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-500' : ''}`} />
          </button>
        </div>

        {/* Mobile & Desktop Instant Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/60 backdrop-blur-[2px]">
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-400/40 transform scale-75 group-hover:scale-100 transition-transform duration-300 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </button>
        </div>
      </Link>

      {/* Card Content Footer */}
      <div className="p-3 flex items-center justify-between bg-slate-950/90 border-t border-slate-800/80">
        <div className="flex flex-col min-w-0 pr-2">
          <Link to={`/games/${game.slug}`} className="font-extrabold text-xs sm:text-sm text-white hover:text-cyan-400 transition-colors truncate">
            {game.title}
          </Link>
          <span className="text-[10px] font-semibold text-slate-400 truncate">
            {(game.plays / 1000).toFixed(1)}k plays • {game.category}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-[11px] font-extrabold text-amber-400 shrink-0">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{game.rating}</span>
        </div>
      </div>

    </div>
  );
};

function Gamepad2Icon(props: any) {
  return <Sparkles {...props} />;
}
