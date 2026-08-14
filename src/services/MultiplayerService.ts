export interface ScoreChallengePayload {
  challengerName: string;
  gameId: string;
  targetScore: number;
  createdAt: number;
}

class MultiplayerService {
  // Encode challenge URL parameter
  public createChallengeLink(gameId: string, targetScore: number, challengerName: string): string {
    const payload: ScoreChallengePayload = {
      challengerName,
      gameId,
      targetScore,
      createdAt: Date.now()
    };

    const encoded = btoa(JSON.stringify(payload));
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://manuplay.app';
    return `${baseUrl}/game/${gameId}/play?challenge=${encodeURIComponent(encoded)}`;
  }

  // Decode challenge URL parameter
  public parseChallengeLink(encodedParam: string): ScoreChallengePayload | null {
    try {
      const decoded = atob(decodeURIComponent(encodedParam));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  // AI Opponent Generator for simulated 1v1 play
  public getAIOpponent(_gameId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    const names = ['CyberBot_99', 'NeonRacer_X', 'PixelKnight', 'VortexAI', 'ShadowStrike'];
    const selectedName = names[Math.floor(Math.random() * names.length)];

    const difficultyMultipliers = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.35
    };

    return {
      name: selectedName,
      difficulty,
      multiplier: difficultyMultipliers[difficulty]
    };
  }
}

export const multiplayerService = new MultiplayerService();
