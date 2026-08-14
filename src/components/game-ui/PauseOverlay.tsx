import React, { useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';
import { Button } from '../common/Button';
import { storageService } from '../../services/StorageService';
import { audioService } from '../../services/AudioService';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onRestart,
  onExit
}) => {
  const [muted, setMuted] = useState(() => storageService.getPreferences().muted);

  const toggleSound = () => {
    const updated = storageService.savePreferences({ muted: !muted });
    setMuted(updated.muted);
    audioService.updateVolumes();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-xl animate-fadeIn select-none">
      
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center shadow-2xl shadow-cyan-500/10 space-y-6">
        
        <div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase mb-1">
            PAUSED
          </h2>
          <p className="text-xs text-slate-400">Game suspended. Choose an action below.</p>
        </div>

        <div className="space-y-3">
          <Button variant="primary" size="lg" fullWidth onClick={onResume}>
            <Play className="w-5 h-5 fill-slate-950" /> RESUME
          </Button>

          <Button variant="outline" size="md" fullWidth onClick={onRestart}>
            <RotateCcw className="w-4 h-4" /> RESTART GAME
          </Button>

          <Button variant="outline" size="md" fullWidth onClick={toggleSound}>
            {muted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" /> SOUND: MUTED
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" /> SOUND: ON
              </>
            )}
          </Button>

          <Button variant="ghost" size="md" fullWidth onClick={onExit}>
            <Home className="w-4 h-4" /> EXIT TO HOME
          </Button>
        </div>

      </div>

    </div>
  );
};
