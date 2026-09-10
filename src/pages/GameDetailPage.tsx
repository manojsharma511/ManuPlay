import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Heart, Star, Smartphone, Gamepad2, Trophy, Zap, HelpCircle, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { gameService } from '../services/GameService';
import { storageService, type SavedGameState } from '../services/StorageService';
import { CATEGORIES_LIST } from '../games/registry';
import { Button } from '../components/common/Button';
import { GameGrid } from '../components/game-ui/GameGrid';
import { NotFoundPage } from './NotFoundPage';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const GameDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const game = gameService.getGameBySlug(slug || '');

  const [isFav, setIsFav] = useState(false);
  const [saveState, setSaveState] = useState<SavedGameState | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (game) {
      setIsFav(storageService.isFavorite(game.id));
      storageService.loadGameState(game.id).then(setSaveState);
    }
  }, [slug, game]);

  if (!game) return <NotFoundPage />;

  const handleFavoriteToggle = () => {
    const updated = storageService.toggleFavorite(game.id);
    setIsFav(updated);
    storageService.triggerHaptic('light');
  };

  const relatedGames = gameService.getRelatedGames(game.id, 4);
  const categoryInfo = CATEGORIES_LIST.find(c => c.name.toLowerCase() === game.category.toLowerCase());
  const categorySlug = categoryInfo?.slug || game.category.toLowerCase();

  const breadcrumbs = [
    { label: 'Games', url: '/games' },
    { label: `${game.category} Games`, url: `/category/${categorySlug}` },
    { label: game.title }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Dynamic Comprehensive Technical SEO */}
      <SEO
        title={game.seoTitle || `${game.title} – Play Online Free`}
        description={game.seoDescription || game.description}
        path={`/games/${game.slug}`}
        type="game"
        breadcrumbs={breadcrumbs}
        gameData={{
          name: game.title,
          description: game.description,
          category: game.category,
          rating: game.rating,
          plays: game.plays
        }}
      />

      {/* Visible Breadcrumb Navigation */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Banner Header */}
        <div 
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner"
          style={{ background: game.thumbnailBg }}
        >
          {game.coverImage && (
            <img src={game.coverImage} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
          )}
          <div className="relative z-10 p-4 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 text-white shadow-2xl mb-2">
            <Zap className="w-12 h-12" />
          </div>
          <h1 className="relative z-10 text-3xl sm:text-5xl font-black text-white drop-shadow-md tracking-tight">
            {game.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 font-semibold max-w-lg mt-1 drop-shadow">
            {game.tagline}
          </p>

          {/* Primary Play Button CTA */}
          <button
            onClick={() => navigate(`/games/${game.slug}/play`)}
            className="mt-4 px-8 py-3.5 rounded-full bg-cyan-400 text-slate-950 font-black text-base flex items-center gap-2 shadow-xl shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> PLAY NOW
          </button>
        </div>

        {/* Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/category/${categorySlug}`}
                className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                {game.category}
              </Link>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" /> {game.orientation.toUpperCase()} MODE
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {game.rating}
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              {(game.plays / 1000).toFixed(1)}k Total Plays • Save Supported • Free Instant Browser Game
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isFav ? 'secondary' : 'outline'}
              size="md"
              onClick={handleFavoriteToggle}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
              {isFav ? 'Favorited' : 'Add Favorite'}
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/games/${game.slug}/play`)}
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
            <Button variant="outline" size="sm" onClick={() => navigate(`/games/${game.slug}/play`)}>
              Beat Score
            </Button>
          </div>
        )}

        {/* Structured Content: About */}
        <section className="space-y-3 pt-2">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> About {game.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{game.description}</p>
        </section>

        {/* Structured Content: How to Play */}
        {game.howToPlay && game.howToPlay.length > 0 && (
          <section className="space-y-3 pt-2 border-t border-slate-800/80">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> How to Play {game.title}
            </h2>
            <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
              {game.howToPlay.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-semibold text-slate-200">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Structured Content: Controls */}
        <section className="space-y-3 pt-2 border-t border-slate-800/80">
          <h2 className="text-lg font-extrabold text-white">Game Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Touch Controls */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Touch Controls (Mobile & Tablet)
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {game.controls.mobile.map((ctrl, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keyboard Controls */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" /> Keyboard & Mouse Controls (Desktop)
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {game.controls.desktop.map((ctrl, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* Structured Content: Game Features */}
        {game.features && game.features.length > 0 && (
          <section className="space-y-3 pt-2 border-t border-slate-800/80">
            <h2 className="text-lg font-extrabold text-white">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {game.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-200">
                  <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Structured Content: FAQ */}
        {game.faqs && game.faqs.length > 0 && (
          <section className="space-y-4 pt-2 border-t border-slate-800/80">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" /> Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {game.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <h3 className="text-sm font-bold text-white">{faq.question}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Related Games Internal Linking */}
      <section className="pt-4 space-y-4">
        <h3 className="text-xl font-extrabold text-white">More Free {game.category} Games</h3>
        <GameGrid games={relatedGames} />
      </section>

    </div>
  );
};
