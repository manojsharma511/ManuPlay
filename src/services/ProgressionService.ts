import { storageService } from './StorageService';

export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'racing' | 'action' | 'puzzle' | 'sports' | 'arcade' | 'mastery' | 'explorer';
  unlockedAt?: number;
}

export interface GameMastery {
  gameId: string;
  level: number; // 0 = Unranked, 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Diamond
  progressXP: number;
  totalPlays: number;
  highScore: number;
}

const STORAGE_KEYS = {
  XP: 'manuplay_player_xp',
  MASTERY_PREFIX: 'manuplay_mastery_',
  BADGES: 'manuplay_unlocked_badges'
};

class ProgressionService {
  public getXP(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.XP);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  public getLevelInfo(): { level: number; currentXP: number; nextLevelXP: number; progressPercent: number } {
    const totalXP = this.getXP();
    // Level formula: Level = Math.floor(Math.sqrt(totalXP / 100)) + 1
    let level = 1;
    let requiredXP = 100;

    while (totalXP >= requiredXP) {
      level++;
      requiredXP += level * 150;
    }

    const prevLevelXP = requiredXP - level * 150;
    const currentXPInLevel = totalXP - prevLevelXP;
    const neededXPInLevel = level * 150;
    const progressPercent = Math.min(100, Math.max(0, (currentXPInLevel / neededXPInLevel) * 100));

    return {
      level,
      currentXP: totalXP,
      nextLevelXP: requiredXP,
      progressPercent
    };
  }

  public addXP(amount: number): { totalXP: number; leveledUp: boolean; newLevel: number } {
    const prevLevel = this.getLevelInfo().level;
    const current = this.getXP();
    const updated = current + amount;

    try {
      localStorage.setItem(STORAGE_KEYS.XP, updated.toString());
    } catch (e) {
      console.error('Failed to save XP:', e);
    }

    const newLevelInfo = this.getLevelInfo();
    const leveledUp = newLevelInfo.level > prevLevel;

    if (leveledUp) {
      storageService.triggerHaptic('success');
    }

    return {
      totalXP: updated,
      leveledUp,
      newLevel: newLevelInfo.level
    };
  }

  public getGameMastery(gameId: string): GameMastery {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MASTERY_PREFIX + gameId);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }

    return {
      gameId,
      level: 0,
      progressXP: 0,
      totalPlays: 0,
      highScore: 0
    };
  }

  public recordGamePlay(gameId: string, score: number): { mastery: GameMastery; levelUp: boolean } {
    const current = this.getGameMastery(gameId);
    const updatedPlays = current.totalPlays + 1;
    const updatedScore = Math.max(current.highScore, score);
    const addedXP = Math.round(score * 0.1) + 50;

    const newProgressXP = current.progressXP + addedXP;
    let newLevel = current.level;

    // Mastery thresholds: Level 1 (500 XP), Level 2 (1500 XP), Level 3 (3500 XP), Level 4 (7500 XP)
    if (newProgressXP >= 7500) newLevel = 4;
    else if (newProgressXP >= 3500) newLevel = 3;
    else if (newProgressXP >= 1500) newLevel = 2;
    else if (newProgressXP >= 500) newLevel = 1;

    const updated: GameMastery = {
      gameId,
      level: newLevel,
      progressXP: newProgressXP,
      totalPlays: updatedPlays,
      highScore: updatedScore
    };

    try {
      localStorage.setItem(STORAGE_KEYS.MASTERY_PREFIX + gameId, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save mastery:', e);
    }

    // Award global XP as well
    this.addXP(addedXP);

    return {
      mastery: updated,
      levelUp: newLevel > current.level
    };
  }
}

export const progressionService = new ProgressionService();
