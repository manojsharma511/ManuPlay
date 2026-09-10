import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, Pause, ArrowUp, ArrowDown } from 'lucide-react';
import { inputService, type ControlAction } from '../../services/InputService';
import { storageService } from '../../services/StorageService';

export type ControlMode = 'steering' | 'joystick' | 'runner' | 'tap' | 'standard';

interface TouchOverlayProps {
  onPause: () => void;
  gameId: string;
  orientation?: 'portrait' | 'landscape' | 'any';
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({ onPause, gameId }) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  const isLeftHanded = storageService.getPreferences().leftHandedMode;

  // Determine game control mode
  const getControlMode = (): ControlMode => {
    switch (gameId) {
      case 'neon-drift':
      case 'traffic-rush':
        return 'steering';
      case 'zombie-survival':
      case 'space-shooter':
      case 'dual-arena':
        return 'joystick';
      case 'sky-runner':
      case 'neon-wings':
        return 'runner';
      default:
        return 'standard';
    }
  };

  const mode = getControlMode();

  const handlePointerDown = (action: ControlAction) => (e: React.PointerEvent) => {
    e.stopPropagation();
    inputService.setVirtualButton(action, true);
    storageService.triggerHaptic('light');
  };

  const handlePointerUp = (action: ControlAction) => (e: React.PointerEvent) => {
    e.stopPropagation();
    inputService.setVirtualButton(action, false);
  };

  // Virtual Joystick Handlers
  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsJoystickActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isJoystickActive) return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    inputService.setJoystickVector(0, 0, false);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });

    const normX = dx / maxRadius;
    const normY = dy / maxRadius;
    inputService.setJoystickVector(normX, normY, true);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 select-none touch-none">
      
      {/* Top Bar Pause Trigger */}
      <div className={`flex items-center ${isLeftHanded ? 'justify-end' : 'justify-start'} pointer-events-auto`}>
        <button
          onClick={onPause}
          className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-white backdrop-blur-md active:scale-90 transition-all shadow-lg cursor-pointer"
          aria-label="Pause Game"
        >
          <Pause className="w-6 h-6 fill-white" />
        </button>
      </div>

      {/* Bottom Controls Area */}
      <div className={`flex items-end justify-between w-full pointer-events-auto pb-2 ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Mode 1: Steering Controls (Racing games) */}
        {mode === 'steering' && (
          <>
            {/* Left/Right Steering */}
            <div className="flex items-center gap-3">
              <button
                onPointerDown={handlePointerDown('left')}
                onPointerUp={handlePointerUp('left')}
                onPointerLeave={handlePointerUp('left')}
                onPointerCancel={handlePointerUp('left')}
                className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/60 text-cyan-400 backdrop-blur-md active:bg-cyan-500/40 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button
                onPointerDown={handlePointerDown('right')}
                onPointerUp={handlePointerUp('right')}
                onPointerLeave={handlePointerUp('right')}
                onPointerCancel={handlePointerUp('right')}
                className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/60 text-cyan-400 backdrop-blur-md active:bg-cyan-500/40 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer"
              >
                <ChevronRight className="w-9 h-9" />
              </button>
            </div>

            {/* Brake & Boost */}
            <div className="flex items-center gap-3">
              <button
                onPointerDown={handlePointerDown('brake')}
                onPointerUp={handlePointerUp('brake')}
                onPointerLeave={handlePointerUp('brake')}
                onPointerCancel={handlePointerUp('brake')}
                className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-red-500/60 text-red-400 backdrop-blur-md active:bg-red-500/40 flex flex-col items-center justify-center font-black text-[10px] shadow-xl active:scale-90 transition-all cursor-pointer"
              >
                <Shield className="w-6 h-6 mb-0.5" />
                <span>BRAKE</span>
              </button>
              <button
                onPointerDown={handlePointerDown('boost')}
                onPointerUp={handlePointerUp('boost')}
                onPointerLeave={handlePointerUp('boost')}
                onPointerCancel={handlePointerUp('boost')}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white/50 text-slate-950 shadow-2xl shadow-cyan-500/50 active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-xs cursor-pointer"
              >
                <Zap className="w-8 h-8 fill-slate-950" />
                <span>BOOST</span>
              </button>
            </div>
          </>
        )}

        {/* Mode 2: Virtual Joystick (Action / Shooter games) */}
        {mode === 'joystick' && (
          <>
            {/* Joystick Pad */}
            <div
              ref={joystickRef}
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerUp}
              onPointerCancel={handleJoystickPointerUp}
              className="relative w-36 h-36 rounded-full bg-slate-900/60 border-2 border-cyan-500/40 backdrop-blur-md flex items-center justify-center shadow-2xl touch-none cursor-pointer"
            >
              {/* Inner Thumb Knob */}
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white/60 shadow-lg transition-transform duration-75 pointer-events-none"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                }}
              />
            </div>

            {/* Fire / Action Button */}
            <div className="flex items-center gap-3">
              <button
                onPointerDown={handlePointerDown('action1')}
                onPointerUp={handlePointerUp('action1')}
                onPointerLeave={handlePointerUp('action1')}
                onPointerCancel={handlePointerUp('action1')}
                className="w-22 h-22 rounded-full bg-gradient-to-tr from-pink-500 via-rose-600 to-purple-600 border-2 border-white/50 text-white shadow-2xl shadow-pink-500/50 active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-xs cursor-pointer"
              >
                <Zap className="w-9 h-9 fill-white" />
                <span>FIRE</span>
              </button>
            </div>
          </>
        )}

        {/* Mode 3: Runner Controls (Sky Runner / Neon Wings) */}
        {mode === 'runner' && (
          <div className="w-full flex items-center justify-between">
            <button
              onPointerDown={handlePointerDown('down')}
              onPointerUp={handlePointerUp('down')}
              onPointerLeave={handlePointerUp('down')}
              onPointerCancel={handlePointerUp('down')}
              className="w-20 h-20 rounded-2xl bg-slate-900/80 border-2 border-purple-500/60 text-purple-300 backdrop-blur-md flex flex-col items-center justify-center font-black text-xs shadow-xl active:scale-90 transition-all cursor-pointer"
            >
              <ArrowDown className="w-8 h-8" />
              <span>SLIDE</span>
            </button>

            <button
              onPointerDown={handlePointerDown('action1')}
              onPointerUp={handlePointerUp('action1')}
              onPointerLeave={handlePointerUp('action1')}
              onPointerCancel={handlePointerUp('action1')}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white/60 text-slate-950 shadow-2xl shadow-cyan-500/50 active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-sm cursor-pointer"
            >
              <ArrowUp className="w-9 h-9 stroke-[3]" />
              <span>JUMP</span>
            </button>
          </div>
        )}

        {/* Mode 4: Standard DPAD Controls */}
        {mode === 'standard' && (
          <>
            <div className="flex items-center gap-2">
              <button
                onPointerDown={handlePointerDown('left')}
                onPointerUp={handlePointerUp('left')}
                onPointerLeave={handlePointerUp('left')}
                onPointerCancel={handlePointerUp('left')}
                className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/60 text-cyan-400 backdrop-blur-md active:bg-cyan-500/40 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onPointerDown={handlePointerDown('right')}
                onPointerUp={handlePointerUp('right')}
                onPointerLeave={handlePointerUp('right')}
                onPointerCancel={handlePointerUp('right')}
                className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/60 text-cyan-400 backdrop-blur-md active:bg-cyan-500/40 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onPointerDown={handlePointerDown('action1')}
                onPointerUp={handlePointerUp('action1')}
                onPointerLeave={handlePointerUp('action1')}
                onPointerCancel={handlePointerUp('action1')}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white/40 text-slate-950 shadow-xl shadow-cyan-500/40 active:scale-90 transition-transform flex flex-col items-center justify-center font-black text-xs cursor-pointer"
              >
                <Zap className="w-8 h-8 fill-slate-950" />
                <span>ACTION</span>
              </button>
            </div>
          </>
        )}

      </div>

    </div>
  );
};
