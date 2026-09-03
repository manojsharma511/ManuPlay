import { manuCoinsService } from './ManuCoinsService';
import { progressionService } from './ProgressionService';
import { storageService } from './StorageService';

const STREAK_KEY = 'manuplay_daily_streak';
const LAST_PLAY_KEY = 'manuplay_last_play_date';

export interface StreakInfo {
  currentStreak: number;
  lastPlayDate: string;
  isStreakActiveToday: boolean;
  nextMilestone: number;
}

class StreakService {
  public getStreakInfo(): StreakInfo {
    try {
      const streakRaw = localStorage.getItem(STREAK_KEY);
      const lastPlay = localStorage.getItem(LAST_PLAY_KEY) || '';
      const streak = streakRaw ? parseInt(streakRaw, 10) : 1;

      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = lastPlay === todayStr;

      let nextMilestone = 3;
      if (streak >= 30) nextMilestone = 100;
      else if (streak >= 7) nextMilestone = 30;
      else if (streak >= 3) nextMilestone = 7;

      return {
        currentStreak: streak,
        lastPlayDate: lastPlay,
        isStreakActiveToday: isToday,
        nextMilestone
      };
    } catch {
      return { currentStreak: 1, lastPlayDate: '', isStreakActiveToday: false, nextMilestone: 3 };
    }
  }

  public recordDailyActivity(): { streak: number; bonusAwarded: boolean } {
    const info = this.getStreakInfo();
    const todayStr = new Date().toISOString().split('T')[0];

    if (info.lastPlayDate === todayStr) {
      return { streak: info.currentStreak, bonusAwarded: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (info.lastPlayDate === yesterdayStr) {
      newStreak = info.currentStreak + 1;
    }

    try {
      localStorage.setItem(STREAK_KEY, newStreak.toString());
      localStorage.setItem(LAST_PLAY_KEY, todayStr);
    } catch (e) {
      console.error('Failed to save streak:', e);
    }

    // Milestone bonus
    let bonusAwarded = false;
    if (newStreak === 3 || newStreak === 7 || newStreak === 30 || newStreak === 100) {
      manuCoinsService.addCoins(newStreak * 50);
      progressionService.addXP(newStreak * 100);
      storageService.triggerHaptic('success');
      bonusAwarded = true;
    }

    return { streak: newStreak, bonusAwarded };
  }
}

export const streakService = new StreakService();
