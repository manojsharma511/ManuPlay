import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Games Found',
  description = 'Try searching with a different term or exploring our popular categories.',
  actionText = 'Explore Catalog',
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
        {icon || <Gamepad2 className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="max-w-md text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      {onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
