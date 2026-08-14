import React from 'react';
import { useParams } from 'react-router-dom';
import { gameService } from '../services/GameService';
import { GameShell } from '../components/player/GameShell';
import { NotFoundPage } from './NotFoundPage';

export const GamePlayPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const game = gameService.getGameBySlug(slug || '');

  if (!game) return <NotFoundPage />;

  return <GameShell game={game} />;
};
