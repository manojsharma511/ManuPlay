import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  gameTitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, gameTitle }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-lg select-none">
      
      {/* Brand Icon */}
      <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500 to-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
        <div className="relative w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400">
          <Gamepad2 className="w-8 h-8 animate-bounce" />
        </div>
      </div>

      <span className="text-xs font-black tracking-widest text-cyan-400 uppercase mb-1">MANUPLAY</span>
      <h3 className="text-xl font-bold text-white mb-6">{gameTitle ? `Loading ${gameTitle}...` : 'Preparing Game...'}</h3>

      {/* Progress Bar */}
      <div className="w-64 max-w-full h-3 rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden relative shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      <span className="text-xs font-semibold text-slate-400 mt-2">{Math.round(progress)}%</span>

    </div>
  );
};
