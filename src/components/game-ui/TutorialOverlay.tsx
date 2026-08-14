import React, { useState } from 'react';
import { Sparkles, CheckCircle, SkipForward } from 'lucide-react';
import { storageService } from '../../services/StorageService';

export interface TutorialStep {
  title: string;
  description: string;
  actionHint: string;
}

interface TutorialOverlayProps {
  gameId: string;
  steps: TutorialStep[];
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  gameId,
  steps,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!steps || steps.length === 0) return null;

  const step = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      storageService.setTutorialCompleted(gameId);
      onComplete();
    }
  };

  const handleSkip = () => {
    storageService.setTutorialCompleted(gameId);
    onComplete();
  };

  return (
    <div className="absolute inset-x-4 bottom-24 z-30 flex flex-col items-center animate-slideUp pointer-events-auto">
      <div className="w-full max-w-sm bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative">
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>TUTORIAL ({currentStepIndex + 1}/{steps.length})</span>
          </div>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 cursor-pointer"
          >
            <SkipForward className="w-3 h-3" /> SKIP
          </button>
        </div>

        <h4 className="font-extrabold text-white text-sm mb-1">{step.title}</h4>
        <p className="text-slate-300 text-xs mb-3 font-medium leading-relaxed">{step.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {step.actionHint}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
          >
            {currentStepIndex < steps.length - 1 ? 'NEXT' : 'GOT IT!'} <CheckCircle className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
