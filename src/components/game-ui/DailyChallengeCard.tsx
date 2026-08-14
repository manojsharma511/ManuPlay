import React, { useState } from 'react';
import { Check, Sparkles, Trophy } from 'lucide-react';
import { challengeService, type Challenge } from '../../services/ChallengeService';
import { Button } from '../common/Button';

export const DailyChallengeCard: React.FC<{ challenge: Challenge; onClaimed?: () => void }> = ({
  challenge,
  onClaimed
}) => {
  const [claimed, setClaimed] = useState(challenge.claimed);

  const handleClaim = () => {
    const success = challengeService.claimReward(challenge.id);
    if (success) {
      setClaimed(true);
      if (onClaimed) onClaimed();
    }
  };

  const progressPercent = Math.min(100, (challenge.currentCount / challenge.targetCount) * 100);

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-cyan-400">
            <Sparkles className="w-3 h-3" /> {challenge.type} QUEST
          </div>
          <h4 className="font-extrabold text-sm text-white">{challenge.title}</h4>
          <p className="text-xs text-slate-400">{challenge.description}</p>
        </div>
        <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
          +{challenge.xpReward} XP
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold text-slate-400">
          <span>Progress</span>
          <span>{challenge.currentCount} / {challenge.targetCount}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Claim Button */}
      {challenge.completed ? (
        claimed ? (
          <div className="py-1.5 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
            <Check className="w-4 h-4 text-cyan-400" /> Reward Claimed
          </div>
        ) : (
          <Button variant="primary" size="sm" fullWidth onClick={handleClaim}>
            <Trophy className="w-4 h-4" /> CLAIM +{challenge.xpReward} XP
          </Button>
        )
      ) : (
        <div className="py-1 text-center text-[11px] font-semibold text-slate-500">
          In Progress ({Math.round(progressPercent)}%)
        </div>
      )}
    </div>
  );
};
