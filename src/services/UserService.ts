export interface UserProfile {
  id: string;
  username: string;
  avatarSeed: string;
  joinedAt: number;
  gamesPlayedCount: number;
  totalScore: number;
}

const PROFILE_KEY = 'manuplay_guest_profile';

class UserService {
  private profile: UserProfile | null = null;

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        this.profile = JSON.parse(raw);
        return this.profile!;
      }
    } catch {
      // Ignore error
    }

    // Generate Guest profile
    const randomId = Math.floor(1000 + Math.random() * 9000);
    this.profile = {
      id: `guest_${Date.now()}`,
      username: `Guest Player #${randomId}`,
      avatarSeed: `cyber_${randomId}`,
      joinedAt: Date.now(),
      gamesPlayedCount: 0,
      totalScore: 0
    };

    this.saveProfile();
    return this.profile;
  }

  public getProfile(): UserProfile {
    return this.profile || this.loadProfile();
  }

  public saveProfile(updated?: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.getProfile(), ...(updated || {}) };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
    return this.profile;
  }

  public recordGameCompleted(score: number): void {
    const p = this.getProfile();
    this.saveProfile({
      gamesPlayedCount: p.gamesPlayedCount + 1,
      totalScore: p.totalScore + score
    });
  }
}

export const userService = new UserService();
