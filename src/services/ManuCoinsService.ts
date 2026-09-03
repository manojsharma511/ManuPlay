import { storageService } from './StorageService';

const STORAGE_KEY = 'manuplay_coins_balance';

class ManuCoinsService {
  public getBalance(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) : 250; // Starting bonus
    } catch {
      return 250;
    }
  }

  public addCoins(amount: number): number {
    const current = this.getBalance();
    const updated = current + amount;
    try {
      localStorage.setItem(STORAGE_KEY, updated.toString());
      storageService.triggerHaptic('light');
    } catch (e) {
      console.error('Failed to save ManuCoins:', e);
    }
    return updated;
  }

  public spendCoins(amount: number): boolean {
    const current = this.getBalance();
    if (current < amount) return false;

    const updated = current - amount;
    try {
      localStorage.setItem(STORAGE_KEY, updated.toString());
      storageService.triggerHaptic('medium');
    } catch (e) {
      console.error('Failed to deduct ManuCoins:', e);
    }
    return true;
  }
}

export const manuCoinsService = new ManuCoinsService();
