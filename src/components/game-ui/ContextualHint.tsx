import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface ContextualHintProps {
  hintText: string;
  durationMs?: number;
}

export const ContextualHint: React.FC<ContextualHintProps> = ({
  hintText,
  durationMs = 4000
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [hintText, durationMs]);

  if (!visible || !hintText) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-fadeIn">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-xs font-black tracking-wide shadow-xl backdrop-blur-md">
        <Info className="w-4 h-4 text-cyan-400 animate-bounce flex-shrink-0" />
        <span>{hintText}</span>
      </div>
    </div>
  );
};
