import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/25 border border-cyan-300/30',
    secondary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110 shadow-lg shadow-purple-500/25 border border-purple-400/30',
    outline: 'bg-slate-900/60 border border-slate-700 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-800/80',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-red-500/25',
    ghost: 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5 font-bold tracking-wide'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className))}
      {...props}
    >
      {children}
    </button>
  );
};
