import React from 'react';
import { Smartphone, RotateCw } from 'lucide-react';
import { Button } from '../common/Button';

interface OrientationPromptProps {
  requiredOrientation: 'portrait' | 'landscape';
  onDismiss?: () => void;
}

export const OrientationPrompt: React.FC<OrientationPromptProps> = ({
  requiredOrientation,
  onDismiss
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl text-center select-none">
      
      {/* Animated Phone Graphic */}
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping" />
        <div className="relative p-5 rounded-3xl bg-slate-900 border-2 border-cyan-400 text-cyan-400 shadow-2xl shadow-cyan-500/20 animate-pulse">
          <Smartphone className={`w-12 h-12 transition-transform duration-700 ${requiredOrientation === 'landscape' ? 'rotate-90' : 'rotate-0'}`} />
        </div>
        <RotateCw className="w-8 h-8 text-purple-400 absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '4s' }} />
      </div>

      <h2 className="text-2xl font-black text-white tracking-wide mb-2">
        Rotate Your Phone
      </h2>

      <p className="text-sm text-slate-300 max-w-xs mb-8 leading-relaxed">
        This game plays best in <span className="text-cyan-400 font-bold uppercase">{requiredOrientation}</span> mode. Rotate your device to continue.
      </p>

      {onDismiss && (
        <Button variant="outline" size="md" onClick={onDismiss}>
          Continue Anyway
        </Button>
      )}

    </div>
  );
};
