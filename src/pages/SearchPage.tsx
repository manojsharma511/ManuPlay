import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Tag, Sparkles } from 'lucide-react';
import { gameService } from '../services/GameService';
import { analyticsService } from '../services/AnalyticsService';
import { GameGrid } from '../components/game-ui/GameGrid';
import { EmptyState } from '../components/common/EmptyState';

const POPULAR_SEARCH_TAGS = ['Racing', 'Zombie', 'Puzzle', 'Runner', 'Shooter', 'Cyberpunk', 'Space'];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  const searchResults = gameService.getGames({ query });

  useEffect(() => {
    if (query.trim()) {
      analyticsService.trackSearch(query, searchResults.length);
    }
  }, [query, searchResults.length]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const params = new URLSearchParams();
    if (val) params.set('q', val);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Search Input Hero Header */}
      <div className="relative w-full max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
          Search ManuPlay Games
        </h1>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by title, genre, tag (e.g. car, zombie, block)..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
            className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-slate-800 focus:border-cyan-400 rounded-2xl text-base text-slate-100 placeholder-slate-500 shadow-xl focus:outline-none transition-all"
          />
          <SearchIcon className="w-6 h-6 text-cyan-400 absolute left-4 top-4 pointer-events-none" />
        </div>

        {/* Popular Tags */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5 text-cyan-400" /> Popular:
          </span>
          {POPULAR_SEARCH_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleQueryChange(tag)}
              className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {query && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 pt-4">
          <span className="text-sm font-bold text-slate-300">
            Search Results for "<span className="text-cyan-400">{query}</span>"
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {searchResults.length} {searchResults.length === 1 ? 'game found' : 'games found'}
          </span>
        </div>
      )}

      {/* Results Grid or Empty State */}
      {searchResults.length > 0 ? (
        <GameGrid games={searchResults} />
      ) : query ? (
        <EmptyState
          title={`No Games Found for "${query}"`}
          description="Try searching with a broader keyword like 'racing', 'action', or 'puzzle'."
          actionText="Clear Search"
          onAction={() => handleQueryChange('')}
        />
      ) : (
        <div className="pt-8">
          <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> Recommended Games
          </h3>
          <GameGrid games={gameService.getAllGames()} />
        </div>
      )}

    </div>
  );
};
