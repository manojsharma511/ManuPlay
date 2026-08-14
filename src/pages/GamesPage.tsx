import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { gameService } from '../services/GameService';
import { CATEGORIES_LIST } from '../games/registry';
import { CategoryChip } from '../components/navigation/CategoryChip';
import { GameGrid } from '../components/game-ui/GameGrid';
import { EmptyState } from '../components/common/EmptyState';

export const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const activeSort = (searchParams.get('sort') || 'popular') as 'popular' | 'newest' | 'rating' | 'title';

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const filteredGames = useMemo(() => {
    return gameService.getGames({
      category: activeCategory === 'All' ? undefined : activeCategory,
      query: searchQuery,
      sortBy: activeSort
    });
  }, [activeCategory, searchQuery, activeSort]);

  const handleCategoryChange = (catName: string) => {
    const params = new URLSearchParams(searchParams);
    if (catName === 'All') params.delete('category');
    else params.set('category', catName);
    setSearchParams(params);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Page Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">All Instant Games</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse our complete collection of mobile-first web games.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Category Chips & Sort Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        {/* Category Chips Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto py-1">
          <CategoryChip
            label="All Games"
            active={activeCategory === 'All'}
            onClick={() => handleCategoryChange('All')}
            count={gameService.getAllGames().length}
          />
          {CATEGORIES_LIST.map(cat => (
            <CategoryChip
              key={cat.slug}
              label={cat.name}
              active={activeCategory.toLowerCase() === cat.name.toLowerCase()}
              onClick={() => handleCategoryChange(cat.name)}
              count={cat.count}
            />
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>Sort by:</span>
          <select
            value={activeSort}
            onChange={handleSortChange}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest Releases</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>

      </div>

      {/* Game Grid or Empty State */}
      {filteredGames.length > 0 ? (
        <GameGrid games={filteredGames} />
      ) : (
        <EmptyState
          title="No Games Match Your Filters"
          description={`We couldn't find any games under "${searchQuery || activeCategory}". Try clearing your filters.`}
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSearchParams(new URLSearchParams());
          }}
        />
      )}

    </div>
  );
};
