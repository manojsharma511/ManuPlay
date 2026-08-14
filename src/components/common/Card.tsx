import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  glass = true,
  hoverable = true,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl overflow-hidden transition-all duration-200 border border-slate-800/80',
          glass ? 'bg-slate-900/70 backdrop-blur-md' : 'bg-slate-900',
          hoverable && 'hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 active:scale-[0.98]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
