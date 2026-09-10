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

const enrichedCache = new Map<string, GameDefinition>();

function enrichGameSEO(game: GameDefinition): GameDefinition {
  if (enrichedCache.has(game.id)) {
    return enrichedCache.get(game.id)!;
  }

  const seoTitle = game.seoTitle || `${game.title} – Play Online Free | ManuPlay`;
  const seoDescription = game.seoDescription || `Play ${game.title} online for free on ManuPlay. ${game.description} No downloads, zero ads, instant action on mobile and desktop.`;
  
  const howToPlay = game.howToPlay && game.howToPlay.length > 0 ? game.howToPlay : [
    `Launch ${game.title} directly in your browser by clicking START GAME.`,
    `Review the controls: Desktop uses keyboard/mouse, Mobile uses responsive touch buttons.`,
    `Score points, complete objectives, beat your local high score, and earn ManuCoins!`
  ];

  const features = game.features && game.features.length > 0 ? game.features : [
    'Instant free browser play with zero install',
    'Responsive touch & keyboard control scheme',
    'Local high score and progress save system',
    'Earn ManuCoins and level up your player profile',
    'High performance lightweight HTML5 engine'
  ];

  const faqs = game.faqs && game.faqs.length > 0 ? game.faqs : [
    {
      question: `Is ${game.title} free to play online?`,
      answer: `Yes! ${game.title} is 100% free to play directly on ManuPlay without any downloads or mandatory registration.`
    },
    {
      question: `Can I play ${game.title} on my phone or tablet?`,
      answer: `Yes, ${game.title} is fully optimized for mobile touchscreens (iOS and Android) as well as desktop browsers.`
    },
    {
      question: `Does ${game.title} save my progress and high score?`,
      answer: `Yes, ManuPlay automatically saves your personal best score, coin earnings, and progression locally.`
    }
  ];

  const enriched: GameDefinition = {
    ...game,
    seoTitle,
    seoDescription,
    howToPlay,
    features,
    faqs
  };

  enrichedCache.set(game.id, enriched);
  return enriched;
}

class GameService {
  public getAllGames(): GameDefinition[] {
    return GAMES_CATALOG.map(enrichGameSEO);
  }

  public getGameBySlug(slug: string): GameDefinition | undefined {
    const raw = GAMES_CATALOG.find(g => g.slug === slug || g.id === slug);
    return raw ? enrichGameSEO(raw) : undefined;
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

    return result.map(enrichGameSEO);
  }

  public getRelatedGames(currentGameId: string, limit = 4): GameDefinition[] {
    const current = GAMES_CATALOG.find(g => g.id === currentGameId || g.slug === currentGameId);
    if (!current) return this.getAllGames().slice(0, limit);

    return GAMES_CATALOG
      .filter(g => g.id !== current.id)
      .sort((a, b) => {
        const sameCat = (b.category === current.category ? 2 : 0) - (a.category === current.category ? 2 : 0);
        return sameCat || (b.rating - a.rating);
      })
      .slice(0, limit)
      .map(enrichGameSEO);
  }

  public getSurpriseGame(excludeIds: string[] = []): GameDefinition {
    const candidates = GAMES_CATALOG.filter(g => !excludeIds.includes(g.id));
    const pool = candidates.length > 0 ? candidates : GAMES_CATALOG;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return enrichGameSEO(pool[randomIndex]);
  }

  public getGameOfDay(): GameDefinition {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % GAMES_CATALOG.length;
    return enrichGameSEO(GAMES_CATALOG[index] || GAMES_CATALOG[0]);
  }
}

export const gameService = new GameService();
