import React from 'react';
import type { GameDefinition } from '../../games/types';
import { GameCard } from './GameCard';

interface GameGridProps {
  games: GameDefinition[];
}

export const GameGrid: React.FC<GameGridProps> = ({ games }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 my-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
};
