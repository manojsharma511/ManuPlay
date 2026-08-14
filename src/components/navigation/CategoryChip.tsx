import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  active = false,
  onClick,
  count
}) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        clsx(
          'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 select-none',
          active
            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300/40'
            : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850'
        )
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'px-1.5 py-0.2 text-[10px] rounded-full font-black',
            active ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
