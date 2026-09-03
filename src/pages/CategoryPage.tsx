import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Gamepad2, Layers, ShieldCheck } from 'lucide-react';
import { gameService } from '../services/GameService';
import { CATEGORIES_LIST } from '../games/registry';
import { GameGrid } from '../components/game-ui/GameGrid';
import { CategoryCard } from '../components/game-ui/CategoryCard';
import { EmptyState } from '../components/common/EmptyState';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const categoryInfo = CATEGORIES_LIST.find(c => c.slug === slug);
  const categoryName = categoryInfo?.name || slug || 'Games';

  const categoryGames = gameService.getGames({ category: categoryName });
  const otherCategories = CATEGORIES_LIST.filter(c => c.slug !== slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const breadcrumbs = [
    { label: 'Games', url: '/games' },
    { label: `${categoryName} Games` }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Category SEO Header */}
      <SEO
        title={`${categoryName} Games — Play Free Online`}
        description={`Play the best free online ${categoryName.toLowerCase()} games on ManuPlay. Enjoy fast instant-play browser games with high score saving on mobile and desktop.`}
        path={`/category/${slug}`}
        breadcrumbs={breadcrumbs}
      />

      {/* Visible Breadcrumb Navigation */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Category Hero Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${categoryInfo?.bgGradient || 'from-cyan-500 to-blue-600'} text-white shadow-xl`}>
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white capitalize">
              Free {categoryName} Games
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Discover and play high quality, instant free {categoryName.toLowerCase()} games in your mobile or desktop browser. No downloads, zero installs, instant gaming fun!
            </p>
          </div>
        </div>
      </div>

      {/* Category Games Grid */}
      {categoryGames.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Popular {categoryName} Titles ({categoryGames.length})</span>
          </h2>
          <GameGrid games={categoryGames} />
        </section>
      ) : (
        <EmptyState
          title={`No ${categoryName} Games Yet`}
          description="We are constantly adding fresh titles to this category. Check back soon!"
          actionText="Explore All Games"
          onAction={() => window.location.href = '/games'}
        />
      )}

      {/* SEO Category Text Section */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Why Play {categoryName} Games on ManuPlay?
        </h3>
        <p>
          ManuPlay provides zero-friction instant browser gaming for {categoryName.toLowerCase()} enthusiasts worldwide. All games are lightweight, optimized for high FPS performance across smartphones, tablets, and desktop browsers, and save your progress automatically.
        </p>
      </div>

      {/* Related Categories Navigation */}
      <section className="pt-6 border-t border-slate-800">
        <h3 className="text-lg font-extrabold text-white mb-4">Explore More Game Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCategories.slice(0, 4).map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

    </div>
  );
};
