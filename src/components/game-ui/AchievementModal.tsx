import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { achievementService, type Achievement } from '../../services/AchievementService';

export const AchievementModal: React.FC = () => {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const unsubscribe = achievementService.onUnlock((ach) => {
      setUnlockedAchievement(ach);
    });
    return unsubscribe;
  }, []);

  if (!unlockedAchievement) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-32px)] glass-panel border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 animate-slideDown flex items-start gap-3 select-none">
      <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-2xl shrink-0">
        {unlockedAchievement.icon || '🏆'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> ACHIEVEMENT UNLOCKED
          </span>
          <button
            onClick={() => setUnlockedAchievement(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
          {unlockedAchievement.title}
        </h4>
        <p className="text-xs text-slate-300 leading-tight line-clamp-2 mt-0.5">
          {unlockedAchievement.description}
        </p>

        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
          +{unlockedAchievement.xpReward} XP EARNED
        </div>
      </div>
    </div>
  );
};
