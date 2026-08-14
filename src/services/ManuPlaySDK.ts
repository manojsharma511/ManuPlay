import { storageService } from './StorageService';
import { progressionService } from './ProgressionService';
import { achievementService } from './AchievementService';
import { challengeService } from './ChallengeService';
import { analyticsService } from './AnalyticsService';

export class ManuPlayGameSDK {
  public static gameStarted(gameId: string) {
    analyticsService.trackGameStart(gameId);
    achievementService.checkAndUnlock('first_play');

    const playedGames = storageService.getRecentlyPlayed();
    if (playedGames.length >= 5) {
      achievementService.checkAndUnlock('explorer');
    }
  }

  public static gameCompleted(gameId: string, score: number) {
    analyticsService.trackGameOver(gameId, score);

    // Record score & mastery
    const { levelUp } = progressionService.recordGamePlay(gameId, score);
    if (levelUp) {
      achievementService.checkAndUnlock('mastery_bronze');
    }

    // Specific game achievement triggers
    if (gameId === 'neon-drift' && score >= 5000) achievementService.checkAndUnlock('speed_demon');
    if (gameId === 'sky-runner' && score >= 3000) achievementService.checkAndUnlock('sky_high');
    if (gameId === 'zombie-survival' && score >= 1500) achievementService.checkAndUnlock('zombie_slayer');
    if (gameId === 'block-puzzle' && score >= 2000) achievementService.checkAndUnlock('puzzle_master');
    if (gameId === 'space-shooter' && score >= 5000) achievementService.checkAndUnlock('galaxy_ace');
    if (gameId === 'tower-defense' && score >= 2000) achievementService.checkAndUnlock('tower_strategist');
    if (gameId === 'hoop-master' && score >= 500) achievementService.checkAndUnlock('hoop_king');
    if (gameId === 'neon-wings' && score >= 20) achievementService.checkAndUnlock('wing_flapper');

    // Daily quest updates
    if (gameId === 'neon-drift') challengeService.updateProgress('daily_1', score);
    if (gameId === 'sky-runner') challengeService.updateProgress('daily_2', 1);
    if (gameId === 'block-puzzle') challengeService.updateProgress('daily_3', 1);
    challengeService.updateProgress('weekly_1', 1);
  }

  public static shareGame(gameTitle: string, gameUrl: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${gameTitle} on ManuPlay`,
        text: `Play ${gameTitle} instantly on ManuPlay with zero downloads!`,
        url: gameUrl
      }).then(() => {
        achievementService.checkAndUnlock('social_challenger');
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gameUrl);
      achievementService.checkAndUnlock('social_challenger');
    }
  }
}
