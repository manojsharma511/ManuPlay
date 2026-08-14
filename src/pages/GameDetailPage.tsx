import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Heart, Star, Smartphone, Gamepad2, ArrowLeft, Trophy, Zap } from 'lucide-react';
import { gameService } from '../services/GameService';
import { storageService, type SavedGameState } from '../services/StorageService';
import { Button } from '../components/common/Button';
import { GameGrid } from '../components/game-ui/GameGrid';
import { NotFoundPage } from './NotFoundPage';

export const GameDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const game = gameService.getGameBySlug(slug || '');

  const [isFav, setIsFav] = useState(false);
  const [saveState, setSaveState] = useState<SavedGameState | null>(null);

  useEffect(() => {
    if (game) {
      setIsFav(storageService.isFavorite(game.id));
      storageService.loadGameState(game.id).then(setSaveState);
    }
  }, [game]);

  if (!game) return <NotFoundPage />;

  const handleFavoriteToggle = () => {
    const updated = storageService.toggleFavorite(game.id);
    setIsFav(updated);
    storageService.triggerHaptic('light');
  };

  const relatedGames = gameService.getRelatedGames(game.id, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Back Link */}
      <Link to="/games" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      {/* Main Game Detail Hero Card */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Banner Artwork Header */}
        <div 
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner"
          style={{ background: game.thumbnailBg }}
        >
          <div className="p-4 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 text-white shadow-2xl mb-2">
            <Zap className="w-12 h-12" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md tracking-tight">
            {game.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 font-semibold max-w-lg mt-1 drop-shadow">
            {game.tagline}
          </p>

          {/* Quick Play Floating Button Overlay */}
          <button
            onClick={() => navigate(`/game/${game.slug}/play`)}
            className="mt-4 px-8 py-3.5 rounded-full bg-cyan-400 text-slate-950 font-black text-base flex items-center gap-2 shadow-xl shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> PLAY NOW
          </button>
        </div>

        {/* Info & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                {game.category}
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" /> {game.orientation.toUpperCase()} MODE
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {game.rating}
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              {(game.plays / 1000).toFixed(1)}k Total Plays • Save Supported
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Favorite Toggle Button */}
            <Button
              variant={isFav ? 'secondary' : 'outline'}
              size="md"
              onClick={handleFavoriteToggle}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
              {isFav ? 'Favorited' : 'Add Favorite'}
            </Button>

            {/* Main Primary CTA Play Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/game/${game.slug}/play`)}
            >
              <Play className="w-5 h-5 fill-slate-950" /> START GAME
            </Button>
          </div>
        </div>

        {/* Local Best Score Badge */}
        {saveState && saveState.highScore > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">YOUR LOCAL RECORD</span>
                <h4 className="text-xl font-black text-white">{saveState.highScore.toLocaleString()} pts</h4>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/game/${game.slug}/play`)}>
              Beat Score
            </Button>
          </div>
        )}

        {/* Description & Story */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">About {game.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{game.description}</p>
        </div>

        {/* How to Play & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Mobile Controls */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Touch Controls (Mobile)
            </h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {game.controls.mobile.map((ctrl, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {ctrl}
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop Controls */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" /> Keyboard Controls (Desktop)
            </h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {game.controls.desktop.map((ctrl, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {ctrl}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* Related Games */}
      <section className="pt-4">
        <h3 className="text-xl font-extrabold text-white mb-4">You Might Also Like</h3>
        <GameGrid games={relatedGames} />
      </section>

    </div>
  );
};
