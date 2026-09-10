import React from 'react';
import type { GameDefinition } from '../../games/types';
import { GameCard } from './GameCard';

interface GameCarouselProps {
  title: string;
  subtitle?: string;
  games: GameDefinition[];
  actionLink?: React.ReactNode;
}

export const GameCarousel: React.FC<GameCarouselProps> = ({
  title,
  subtitle,
  games,
  actionLink
}) => {
  return (
    <section className="w-full my-6">
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actionLink}
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {games.map((game) => (
          <div key={game.id} className="w-[68vw] sm:w-[230px] shrink-0 snap-start">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
};
