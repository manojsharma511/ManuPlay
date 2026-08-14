import React from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, Pause } from 'lucide-react';
import { inputService, type ControlAction } from '../../services/InputService';

interface TouchOverlayProps {
  onPause: () => void;
  orientation: 'portrait' | 'landscape' | 'any';
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({ onPause }) => {
  const handleTouchStart = (action: ControlAction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputService.setVirtualButton(action, true);
  };

  const handleTouchEnd = (action: ControlAction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputService.setVirtualButton(action, false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 select-none touch-none">
      
      {/* Top Controls Overlay */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={onPause}
          className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-white backdrop-blur-md active:scale-90 transition-all shadow-lg cursor-pointer"
          aria-label="Pause Game"
        >
          <Pause className="w-6 h-6 fill-white" />
        </button>
      </div>

      {/* Bottom On-Screen Touch Controls */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-2">
        
        {/* Left Side: DPAD / Directional Touch Buttons */}
        <div className="flex items-center gap-2">
          {/* Left Arrow */}
          <button
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
            onMouseDown={handleTouchStart('left')}
            onMouseUp={handleTouchEnd('left')}
            className="w-16 h-16 rounded-2xl bg-slate-900/70 border-2 border-cyan-500/50 text-cyan-400 backdrop-blur-md active:bg-cyan-500/30 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Right Arrow */}
          <button
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
            onMouseDown={handleTouchStart('right')}
            onMouseUp={handleTouchEnd('right')}
            className="w-16 h-16 rounded-2xl bg-slate-900/70 border-2 border-cyan-500/50 text-cyan-400 backdrop-blur-md active:bg-cyan-500/30 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Right Side: Action 1 & Action 2 */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={handleTouchStart('action2')}
            onTouchEnd={handleTouchEnd('action2')}
            onMouseDown={handleTouchStart('action2')}
            onMouseUp={handleTouchEnd('action2')}
            className="w-14 h-14 rounded-2xl bg-slate-900/70 border-2 border-purple-500/50 text-purple-300 backdrop-blur-md active:bg-purple-500/30 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs font-black cursor-pointer"
          >
            <Shield className="w-6 h-6" />
          </button>

          <button
            onTouchStart={handleTouchStart('action1')}
            onTouchEnd={handleTouchEnd('action1')}
            onMouseDown={handleTouchStart('action1')}
            onMouseUp={handleTouchEnd('action1')}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white/40 text-slate-950 shadow-xl shadow-cyan-500/40 active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-xs cursor-pointer"
          >
            <Zap className="w-8 h-8 fill-slate-950" />
            <span>ACTION</span>
          </button>
        </div>

      </div>

    </div>
  );
};
