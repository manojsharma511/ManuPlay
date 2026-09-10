import React from 'react';
import { useParams } from 'react-router-dom';
import { gameService } from '../services/GameService';
import { GameShell } from '../components/player/GameShell';
import { NotFoundPage } from './NotFoundPage';
import { SEO } from '../components/common/SEO';

export const GamePlayPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const game = gameService.getGameBySlug(slug || '');

  if (!game) return <NotFoundPage />;

  return (
    <>
      <SEO
        title={`Play ${game.title} Instant`}
        description={`Play ${game.title} online for free in your browser.`}
        path={`/games/${game.slug}/play`}
        noindex={true}
      />
      <GameShell game={game} />
    </>
  );
};
