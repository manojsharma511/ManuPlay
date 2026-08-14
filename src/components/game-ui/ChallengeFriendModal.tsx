import React, { useState } from 'react';
import { Share2, Copy, Check, Swords } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { multiplayerService } from '../../services/MultiplayerService';
import { userService } from '../../services/UserService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

interface ChallengeFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  score: number;
}

export const ChallengeFriendModal: React.FC<ChallengeFriendModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  score
}) => {
  const [copied, setCopied] = useState(false);
  const profile = userService.getProfile();

  const challengeLink = multiplayerService.createChallengeLink(gameId, score, profile.username);

  const handleShare = () => {
    ManuPlayGameSDK.shareGame(`Beat my score of ${score} in ${gameTitle}!`, challengeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Challenge a Friend">
      <div className="space-y-4 text-center select-none">
        
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 text-cyan-400">
            <Swords className="w-8 h-8" />
          </div>
          <h4 className="font-extrabold text-base text-white">Can your friend beat your score?</h4>
          <p className="text-xs text-slate-400">
            Share this link to challenge anyone to beat <span className="text-cyan-400 font-bold">{score.toLocaleString()} pts</span> in {gameTitle}!
          </p>
        </div>

        {/* Challenge Link Field */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
          <input
            type="text"
            readOnly
            value={challengeLink}
            className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none px-2 truncate"
          />
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleShare}>
          <Share2 className="w-5 h-5" /> SHARE CHALLENGE LINK
        </Button>

      </div>
    </Modal>
  );
};
