import { GAMES_CATALOG } from '../games/registry';
import type { GameDefinition } from '../games/types';

export interface GameFilterOptions {
  category?: string;
  query?: string;
  sortBy?: 'popular' | 'newest' | 'rating' | 'title';
  featuredOnly?: boolean;
  trendingOnly?: boolean;
  limit?: number;
}

class GameService {
  public getAllGames(): GameDefinition[] {
    return GAMES_CATALOG;
  }

  public getGameBySlug(slug: string): GameDefinition | undefined {
    return GAMES_CATALOG.find(g => g.slug === slug || g.id === slug);
  }

  public getGames(options: GameFilterOptions = {}): GameDefinition[] {
    let result = [...GAMES_CATALOG];

    // Category Filter
    if (options.category && options.category.toLowerCase() !== 'all') {
      const cat = options.category.toLowerCase();
      result = result.filter(g => g.category.toLowerCase() === cat || g.tags.some(t => t.toLowerCase() === cat));
    }

    // Search Query Filter
    if (options.query && options.query.trim() !== '') {
      const q = options.query.toLowerCase().trim();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Featured / Trending
    if (options.featuredOnly) {
      result = result.filter(g => g.featured);
    }
    if (options.trendingOnly) {
      result = result.filter(g => g.trending);
    }

    // Sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'popular':
          result.sort((a, b) => b.plays - a.plays);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
          break;
        case 'title':
          result.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
    }

    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  public getRelatedGames(currentGameId: string, limit = 4): GameDefinition[] {
    const current = this.getGameBySlug(currentGameId);
    if (!current) return this.getAllGames().slice(0, limit);

    return GAMES_CATALOG
      .filter(g => g.id !== current.id)
      .sort((a, b) => {
        const sameCat = (b.category === current.category ? 2 : 0) - (a.category === current.category ? 2 : 0);
        return sameCat || (b.rating - a.rating);
      })
      .slice(0, limit);
  }
}

export const gameService = new GameService();
