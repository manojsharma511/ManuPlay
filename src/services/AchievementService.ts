import { progressionService } from './ProgressionService';
import { storageService } from './StorageService';
import { audioService } from './AudioService';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_play',
    title: 'First Step',
    description: 'Play your first instant game on ManuPlay.',
    icon: '🎮',
    xpReward: 100,
    unlocked: false
  },
  {
    id: 'explorer',
    title: 'Catalog Explorer',
    description: 'Play 5 different games across the platform.',
    icon: '🧭',
    xpReward: 250,
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Score 5,000+ points in Neon Drift or Traffic Rush.',
    icon: '⚡',
    xpReward: 300,
    unlocked: false
  },
  {
    id: 'sky_high',
    title: 'High Flyer',
    description: 'Reach 3,000+ distance score in Sky Runner.',
    icon: '✨',
    xpReward: 300,
    unlocked: false
  },
  {
    id: 'zombie_slayer',
    title: 'Zombie Slayer',
    description: 'Survive to Wave 3 in Zombie Survival.',
    icon: '🧟',
    xpReward: 350,
    unlocked: false
  },
  {
    id: 'puzzle_master',
    title: 'Puzzle Master',
    description: 'Score 2,000+ points in Block Puzzle or Cyber Memory.',
    icon: '🧩',
    xpReward: 300,
    unlocked: false
  },
  {
    id: 'galaxy_ace',
    title: 'Galaxy Ace',
    description: 'Score 5,000+ points in Space Shooter.',
    icon: '🚀',
    xpReward: 350,
    unlocked: false
  },
  {
    id: 'tower_strategist',
    title: 'Tactical Defender',
    description: 'Defend against wave 5 in Tower Defense.',
    icon: '🏰',
    xpReward: 400,
    unlocked: false
  },
  {
    id: 'hoop_king',
    title: 'Hoop King',
    description: 'Score 500+ points in Hoop Master.',
    icon: '🏀',
    xpReward: 300,
    unlocked: false
  },
  {
    id: 'wing_flapper',
    title: 'Cyber Flapper',
    description: 'Score 20+ gates in Neon Wings.',
    icon: '🦩',
    xpReward: 300,
    unlocked: false
  },
  {
    id: 'social_challenger',
    title: 'Social Challenger',
    description: 'Share a game or score challenge with a friend.',
    icon: '🔥',
    xpReward: 200,
    unlocked: false
  },
  {
    id: 'mastery_bronze',
    title: 'Game Master',
    description: 'Reach Bronze Mastery in any game.',
    icon: '🏆',
    xpReward: 500,
    unlocked: false
  }
];

const STORAGE_KEY = 'manuplay_unlocked_achievements';

class AchievementService {
  private unlockListeners: Array<(achievement: Achievement) => void> = [];

  public getAchievements(): Achievement[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const unlockedMap: Record<string, number> = raw ? JSON.parse(raw) : {};

      return ACHIEVEMENTS_LIST.map(ach => ({
        ...ach,
        unlocked: !!unlockedMap[ach.id],
        unlockedAt: unlockedMap[ach.id]
      }));
    } catch {
      return ACHIEVEMENTS_LIST;
    }
  }

  public checkAndUnlock(id: string): boolean {
    const achievements = this.getAchievements();
    const target = achievements.find(a => a.id === id);
    if (!target || target.unlocked) return false;

    // Unlock achievement
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const unlockedMap: Record<string, number> = raw ? JSON.parse(raw) : {};
      unlockedMap[id] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMap));
    } catch (e) {
      console.error('Failed to save achievement:', e);
    }

    target.unlocked = true;
    target.unlockedAt = Date.now();

    // Award XP
    progressionService.addXP(target.xpReward);

    // Audio & Haptics celebration
    audioService.playCoin();
    storageService.triggerHaptic('success');

    // Notify UI listeners
    this.notifyUnlock(target);
    return true;
  }

  public onUnlock(fn: (achievement: Achievement) => void): () => void {
    this.unlockListeners.push(fn);
    return () => {
      this.unlockListeners = this.unlockListeners.filter(l => l !== fn);
    };
  }

  private notifyUnlock(achievement: Achievement) {
    this.unlockListeners.forEach(fn => fn(achievement));
  }
}

export const achievementService = new AchievementService();
