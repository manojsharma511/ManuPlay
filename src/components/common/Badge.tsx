import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  icon
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-bold rounded-lg border uppercase tracking-wider select-none backdrop-blur-md',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {icon}
      {children}
    </span>
  );
};
