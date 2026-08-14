import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { gameService } from '../services/GameService';
import { CATEGORIES_LIST } from '../games/registry';
import { GameGrid } from '../components/game-ui/GameGrid';
import { CategoryCard } from '../components/game-ui/CategoryCard';
import { EmptyState } from '../components/common/EmptyState';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const categoryInfo = CATEGORIES_LIST.find(c => c.slug === slug);
  const categoryName = categoryInfo?.name || slug || 'Games';

  const categoryGames = gameService.getGames({ category: categoryName });
  const otherCategories = CATEGORIES_LIST.filter(c => c.slug !== slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <Link to="/games" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${categoryInfo?.bgGradient || 'from-cyan-500 to-blue-600'} text-white shadow-xl`}>
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white capitalize">{categoryName} Games</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Explore all {categoryName.toLowerCase()} games ready to play on mobile.
            </p>
          </div>
        </div>
      </div>

      {/* Category Games Grid */}
      {categoryGames.length > 0 ? (
        <GameGrid games={categoryGames} />
      ) : (
        <EmptyState
          title={`No ${categoryName} Games Yet`}
          description="We are constantly adding fresh titles to this category. Check back soon!"
          actionText="Explore All Games"
          onAction={() => window.location.href = '/games'}
        />
      )}

      {/* Related Categories */}
      <section className="pt-6 border-t border-slate-800">
        <h3 className="text-lg font-extrabold text-white mb-4">More Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCategories.slice(0, 4).map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

    </div>
  );
};
