import { progressionService } from './ProgressionService';
import { storageService } from './StorageService';
import { audioService } from './AudioService';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  gameId?: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  type: 'daily' | 'weekly';
}

const STORAGE_KEY = 'manuplay_user_challenges';

class ChallengeService {
  public getChallenges(): Challenge[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }

    return this.generateDefaultChallenges();
  }

  private generateDefaultChallenges(): Challenge[] {
    return [
      {
        id: 'daily_1',
        title: 'High Speed Drifter',
        description: 'Score 2,000+ points in Neon Drift.',
        gameId: 'neon-drift',
        targetCount: 2000,
        currentCount: 0,
        xpReward: 150,
        completed: false,
        claimed: false,
        type: 'daily'
      },
      {
        id: 'daily_2',
        title: 'Sky Explorer',
        description: 'Collect 5 plasma orbs in Sky Runner.',
        gameId: 'sky-runner',
        targetCount: 5,
        currentCount: 0,
        xpReward: 150,
        completed: false,
        claimed: false,
        type: 'daily'
      },
      {
        id: 'daily_3',
        title: 'Block Breaker',
        description: 'Clear 3 lines in Block Puzzle.',
        gameId: 'block-puzzle',
        targetCount: 3,
        currentCount: 0,
        xpReward: 150,
        completed: false,
        claimed: false,
        type: 'daily'
      },
      {
        id: 'weekly_1',
        title: 'Game Master Quest',
        description: 'Play 5 different games on ManuPlay.',
        targetCount: 5,
        currentCount: 0,
        xpReward: 500,
        completed: false,
        claimed: false,
        type: 'weekly'
      }
    ];
  }

  public updateProgress(challengeId: string, amount: number) {
    const challenges = this.getChallenges();
    const target = challenges.find(c => c.id === challengeId);
    if (!target || target.completed) return;

    target.currentCount = Math.min(target.targetCount, target.currentCount + amount);
    if (target.currentCount >= target.targetCount) {
      target.completed = true;
      audioService.playCoin();
      storageService.triggerHaptic('success');
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
    } catch (e) {
      console.error('Failed to save challenge progress:', e);
    }
  }

  public claimReward(challengeId: string): boolean {
    const challenges = this.getChallenges();
    const target = challenges.find(c => c.id === challengeId);
    if (!target || !target.completed || target.claimed) return false;

    target.claimed = true;
    progressionService.addXP(target.xpReward);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
    } catch (e) {
      console.error('Failed to save claimed challenge:', e);
    }

    audioService.playCoin();
    storageService.triggerHaptic('success');
    return true;
  }
}

export const challengeService = new ChallengeService();
