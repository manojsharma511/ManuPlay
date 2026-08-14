import React from 'react';
import { X, Target, Gamepad2, Smartphone, ShieldCheck, Trophy } from 'lucide-react';
import type { GameDefinition } from '../../games/types';

interface HowToPlayModalProps {
  game: GameDefinition;
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  game,
  isOpen,
  onClose,
  onStartGame
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ background: game.thumbnailBg }}
            >
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">{game.title}</h3>
              <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">How to Play & Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          
          {/* Objective Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" /> Objective
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              {game.description}
            </p>
          </div>

          {/* Goal Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4" /> Goal & Scoring
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Survive as long as possible, build up high-scoring combo multipliers, collect energy power-ups, and beat your personal best score!
            </p>
          </div>

          {/* Controls Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Desktop */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Gamepad2 className="w-4 h-4" /> Keyboard / Mouse
              </div>
              <ul className="space-y-2">
                {game.controls.desktop.map((ctrl, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{ctrl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-pink-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Smartphone className="w-4 h-4" /> Mobile Touch
              </div>
              <ul className="space-y-2">
                {game.controls.mobile.map((ctrl, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>{ctrl}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Mechanics */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" /> Pro Tips & Mechanics
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
              <li>⚡ Pick up glowing energy orbs for instant boosts and points.</li>
              <li>🔥 Chain consecutive actions to unlock massive combo score multipliers.</li>
              <li>⏸ Pause anytime using the pause button or by switching apps.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
            >
              Start Game Now
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
