import { gameService } from './GameService';
import { storageService } from './StorageService';
import type { GameDefinition } from '../games/types';

class RecommendationService {
  public getPersonalizedRecommendations(limit = 6): GameDefinition[] {
    const recents = storageService.getRecentlyPlayed();
    const favorites = storageService.getFavorites();
    const allGames = gameService.getAllGames();

    if (recents.length === 0 && favorites.length === 0) {
      // Default to top rated / featured games
      return allGames.slice(0, limit);
    }

    // Collect preferred categories and tags
    const preferredCategories = new Set<string>();
    const preferredTags = new Set<string>();

    [...recents, ...favorites].forEach(gameId => {
      const g = gameService.getGameBySlug(gameId);
      if (g) {
        preferredCategories.add(g.category);
        g.tags.forEach(t => preferredTags.add(t));
      }
    });

    // Score all games
    const scored = allGames.map(game => {
      let score = 0;
      if (preferredCategories.has(game.category)) score += 5;

      game.tags.forEach(tag => {
        if (preferredTags.has(tag)) score += 2;
      });

      if (game.featured) score += 1;
      if (game.trending) score += 1;
      if (recents.includes(game.id)) score -= 3; // Give priority to unplayed/different games

      return { game, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.game).slice(0, limit);
  }
}

export const recommendationService = new RecommendationService();
