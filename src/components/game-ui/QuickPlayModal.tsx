import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices, Sparkles, Flame, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { gameService } from '../../services/GameService';

interface QuickPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPlayModal: React.FC<QuickPlayModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLaunchRandom = (filter?: 'quick' | 'trending' | 'puzzle') => {
    let pool = gameService.getAllGames();
    if (filter === 'quick') pool = pool.filter(g => g.sessionLength?.includes('Quick'));
    if (filter === 'trending') pool = pool.filter(g => g.trending);
    if (filter === 'puzzle') pool = pool.filter(g => g.category === 'Puzzle');

    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) {
      onClose();
      navigate(`/games/${random.slug}/play`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Surprise Me 🎲 — Quick Play">
      <div className="space-y-4 text-center select-none">
        <p className="text-xs text-slate-300">
          Pick a play mode and jump straight into a game with 1 tap!
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          <Button variant="primary" size="lg" fullWidth onClick={() => handleLaunchRandom()}>
            <Dices className="w-5 h-5" /> SURPRISE ME (ANY GAME)
          </Button>

          <Button variant="secondary" size="md" fullWidth onClick={() => handleLaunchRandom('quick')}>
            <Clock className="w-4 h-4" /> QUICK 2-5 MINUTE GAME
          </Button>

          <Button variant="outline" size="md" fullWidth onClick={() => handleLaunchRandom('trending')}>
            <Flame className="w-4 h-4 text-amber-400" /> HOT TRENDING GAME
          </Button>

          <Button variant="outline" size="md" fullWidth onClick={() => handleLaunchRandom('puzzle')}>
            <Sparkles className="w-4 h-4 text-purple-400" /> RELAXING PUZZLE GAME
          </Button>
        </div>
      </div>
    </Modal>
  );
};
