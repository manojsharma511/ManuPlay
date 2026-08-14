import React from 'react';
import { Play, HelpCircle, Trophy, Zap } from 'lucide-react';
import type { GameDefinition } from '../../games/types';

interface ReadyScreenProps {
  game: GameDefinition;
  bestScore: number;
  onStart: () => void;
  onOpenHowToPlay: () => void;
  isTouchDevice: boolean;
}

export const ReadyScreen: React.FC<ReadyScreenProps> = ({
  game,
  bestScore,
  onStart,
  onOpenHowToPlay,
  isTouchDevice
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: game.accentColor }}
        />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/10" style={{ background: game.thumbnailBg }}>
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide mb-1">{game.title}</h2>
        <p className="text-slate-400 text-xs font-medium mb-4 px-2 line-clamp-2">{game.tagline}</p>

        {/* High Score Badge */}
        {bestScore > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
            <Trophy className="w-4 h-4" />
            <span>PERSONAL BEST: {bestScore.toLocaleString()}</span>
          </div>
        )}

        {/* Quick Controls Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
              {isTouchDevice ? 'Mobile Touch Controls' : 'Desktop Controls'}
            </span>
            <button
              onClick={onOpenHowToPlay}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {(isTouchDevice ? game.controls.mobile : game.controls.desktop).slice(0, 3).map((ctl, idx) => (
              <li key={idx} className="flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span>{ctl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Play Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> TAP TO PLAY NOW
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            FULL INSTRUCTIONS & OBJECTIVES
          </button>
        </div>

      </div>
    </div>
  );
};
