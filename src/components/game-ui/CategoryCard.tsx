import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Swords, Puzzle, Gamepad2, Trophy, Compass, Brain, Smile } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  slug: string;
  count: number;
  iconName: string;
  bgGradient: string;
}

const ICON_MAP: Record<string, any> = {
  Flame, Swords, Puzzle, Gamepad2, Trophy, Compass, Brain, Smile
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  slug,
  count,
  iconName,
  bgGradient
}) => {
  const Icon = ICON_MAP[iconName] || Gamepad2;

  return (
    <Link
      to={`/category/${slug}`}
      className="group relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between h-28 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 active:scale-95"
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 blur-xl group-hover:scale-125 transition-transform" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-cyan-400 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/50">
          {count} {count === 1 ? 'Game' : 'Games'}
        </span>
      </div>

      <div className="relative z-10">
        <h4 className="font-extrabold text-base text-white group-hover:text-cyan-300 transition-colors">
          {name}
        </h4>
      </div>
    </Link>
  );
};
