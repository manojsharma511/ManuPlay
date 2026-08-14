export interface SavedGameState {
  gameId: string;
  highScore: number;
  unlockedLevels?: number;
  customData?: Record<string, any>;
  updatedAt: number;
}

export interface UserPreferences {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  haptics: boolean;
  graphicsQuality: 'auto' | 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  leftHandedMode: boolean;
}

const STORAGE_KEYS = {
  PREFERENCES: 'manuplay_user_preferences',
  FAVORITES: 'manuplay_user_favorites',
  RECENTS: 'manuplay_user_recents',
  TUTORIALS: 'manuplay_tutorials_completed',
  GAME_SAVE_PREFIX: 'manuplay_save_',
  GUEST_PROFILE: 'manuplay_guest_profile'
};

const DEFAULT_PREFERENCES: UserPreferences = {
  masterVolume: 1.0,
  musicVolume: 0.8,
  sfxVolume: 0.9,
  muted: false,
  haptics: true,
  graphicsQuality: 'auto',
  reducedMotion: false,
  leftHandedMode: false
};

class StorageService {
  private db: IDBDatabase | null = null;
  private isDbReady = false;

  constructor() {
    this.initIndexedDB();
  }

  private initIndexedDB() {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const request = indexedDB.open('ManuPlayDB', 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('gameSaves')) {
        db.createObjectStore('gameSaves', { keyPath: 'gameId' });
      }
    };

    request.onsuccess = (event: any) => {
      this.db = event.target.result;
      this.isDbReady = true;
    };

    request.onerror = (err) => {
      console.warn('IndexedDB unavailable, fallback to localStorage', err);
    };
  }

  // User Preferences
  getPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!raw) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const updated = { ...this.getPreferences(), ...prefs };
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
    return updated;
  }

  // Favorites
  getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  toggleFavorite(gameId: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(gameId);
    let isFav = false;
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(gameId);
      isFav = true;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
    return isFav;
  }

  isFavorite(gameId: string): boolean {
    return this.getFavorites().includes(gameId);
  }

  // Recently Played
  getRecentlyPlayed(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  recordRecentPlay(gameId: string): void {
    const current = this.getRecentlyPlayed().filter(id => id !== gameId);
    current.unshift(gameId);
    const limited = current.slice(0, 12);
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(limited));
    } catch (e) {
      console.error('Failed to record recent play:', e);
    }
  }

  // Game Save & High Score
  async saveGameState(gameId: string, state: Partial<SavedGameState>): Promise<void> {
    const existing = await this.loadGameState(gameId);
    const updated: SavedGameState = {
      gameId,
      highScore: Math.max(existing?.highScore || 0, state.highScore || 0),
      unlockedLevels: Math.max(existing?.unlockedLevels || 1, state.unlockedLevels || 1),
      customData: { ...(existing?.customData || {}), ...(state.customData || {}) },
      updatedAt: Date.now()
    };

    if (this.isDbReady && this.db) {
      try {
        const tx = this.db.transaction('gameSaves', 'readwrite');
        const store = tx.objectStore('gameSaves');
        store.put(updated);
      } catch {
        localStorage.setItem(STORAGE_KEYS.GAME_SAVE_PREFIX + gameId, JSON.stringify(updated));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.GAME_SAVE_PREFIX + gameId, JSON.stringify(updated));
    }
  }

  async loadGameState(gameId: string): Promise<SavedGameState | null> {
    if (this.isDbReady && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('gameSaves', 'readonly');
          const store = tx.objectStore('gameSaves');
          const req = store.get(gameId);
          req.onsuccess = () => resolve(req.result || this.loadFromLocalStorage(gameId));
          req.onerror = () => resolve(this.loadFromLocalStorage(gameId));
        } catch {
          resolve(this.loadFromLocalStorage(gameId));
        }
      });
    }
    return this.loadFromLocalStorage(gameId);
  }

  private loadFromLocalStorage(gameId: string): SavedGameState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_SAVE_PREFIX + gameId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Haptic feedback trigger
  triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
    const prefs = this.getPreferences();
    if (!prefs.haptics || typeof window === 'undefined' || !navigator.vibrate) return;

    try {
      switch (type) {
        case 'light': navigator.vibrate(15); break;
        case 'medium': navigator.vibrate(30); break;
        case 'heavy': navigator.vibrate(60); break;
        case 'success': navigator.vibrate([15, 30, 20]); break;
        case 'error': navigator.vibrate([40, 50, 40, 50]); break;
      }
    } catch {
      // Haptics ignore error
    }
  }

  // Tutorial Completion Tracking
  isTutorialCompleted(gameId: string): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TUTORIALS);
      const tutorials = raw ? JSON.parse(raw) : {};
      return !!tutorials[gameId];
    } catch {
      return false;
    }
  }

  setTutorialCompleted(gameId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TUTORIALS);
      const tutorials = raw ? JSON.parse(raw) : {};
      tutorials[gameId] = true;
      localStorage.setItem(STORAGE_KEYS.TUTORIALS, JSON.stringify(tutorials));
    } catch (e) {
      console.error('Failed to save tutorial completion state:', e);
    }
  }
}

export const storageService = new StorageService();
