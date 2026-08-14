import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { gameService } from '../services/GameService';
import { CATEGORIES_LIST } from '../games/registry';
import { GameHero } from '../components/game-ui/GameHero';
import { GameCarousel } from '../components/game-ui/GameCarousel';
import { GameGrid } from '../components/game-ui/GameGrid';
import { CategoryCard } from '../components/game-ui/CategoryCard';

export const HomePage: React.FC = () => {
  const featuredGame = gameService.getGames({ featuredOnly: true })[0];
  const trendingGames = gameService.getGames({ trendingOnly: true });
  const popularGames = gameService.getGames({ sortBy: 'popular' });
  const newGames = gameService.getGames({ sortBy: 'newest' });
  const allGames = gameService.getAllGames();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8">
      
      {/* Hero Section */}
      <GameHero featuredGame={featuredGame} />

      {/* Trending Games Horizontal Carousel */}
      <GameCarousel
        title="🔥 Trending Now"
        subtitle="Most played games across the platform today"
        games={trendingGames}
        actionLink={
          <Link to="/trending" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* Categories Grid */}
      <section className="my-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Browse Categories</h2>
            <p className="text-xs text-slate-400">Explore games by genre</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES_LIST.slice(0, 4).map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      {/* Popular Games Section */}
      <GameCarousel
        title="🏆 Popular Picks"
        subtitle="Top rated by players"
        games={popularGames}
        actionLink={
          <Link to="/games?sort=popular" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* New Releases Section */}
      <GameCarousel
        title="✨ New Releases"
        subtitle="Freshly launched instant games"
        games={newGames}
      />

      {/* Main Full Catalog Grid */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">All Instant Games</h2>
            <p className="text-xs text-slate-400">Jump right into the full catalog</p>
          </div>
          <Link to="/games" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            Full Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <GameGrid games={allGames} />
      </section>

    </div>
  );
};
