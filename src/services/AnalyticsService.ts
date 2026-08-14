class AnalyticsService {
  public trackGameOpen(gameId: string) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Game Opened: ${gameId}`);
    }
  }

  public trackGameStart(gameId: string) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Game Started: ${gameId}`);
    }
  }

  public trackGameOver(gameId: string, score: number) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Game Over: ${gameId} with score ${score}`);
    }
  }

  public trackSearch(query: string, resultsCount: number) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Search: "${query}" -> ${resultsCount} results`);
    }
  }
}

export const analyticsService = new AnalyticsService();
