import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Game Load Error',
  message = 'We encountered an issue loading this game module. Please check your connection and try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-8 text-center rounded-3xl bg-red-950/20 border border-red-500/30 backdrop-blur-sm">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/10">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="max-w-md text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="danger" size="md" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Game
        </Button>
      )}
    </div>
  );
};
