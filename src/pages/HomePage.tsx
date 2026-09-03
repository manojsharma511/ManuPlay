import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dices, Trophy, Sparkles, Zap, Flame } from 'lucide-react';
import { gameService } from '../services/GameService';
import { challengeService } from '../services/ChallengeService';
import { recommendationService } from '../services/RecommendationService';
import { storageService } from '../services/StorageService';
import { streakService } from '../services/StreakService';
import { CATEGORIES_LIST } from '../games/registry';
import { GameHero } from '../components/game-ui/GameHero';
import { GameCarousel } from '../components/game-ui/GameCarousel';
import { GameGrid } from '../components/game-ui/GameGrid';
import { CategoryCard } from '../components/game-ui/CategoryCard';
import { DailyChallengeCard } from '../components/game-ui/DailyChallengeCard';
import { QuickPlayModal } from '../components/game-ui/QuickPlayModal';
import { Button } from '../components/common/Button';
import type { GameDefinition } from '../games/types';

export const HomePage: React.FC = () => {
  const [isQuickPlayOpen, setIsQuickPlayOpen] = useState(false);
  const [recentGames, setRecentGames] = useState<GameDefinition[]>([]);
  const [forYouGames, setForYouGames] = useState<GameDefinition[]>([]);
  const [streakInfo, setStreakInfo] = useState(() => streakService.getStreakInfo());

  const challenges = challengeService.getChallenges().slice(0, 3);
  const featuredGame = gameService.getGameBySlug('manu-kart') || gameService.getGames({ featuredOnly: true })[0];
  const gameOfTheDay = gameService.getGameBySlug('chess') || featuredGame;
  const trendingGames = gameService.getGames({ trendingOnly: true });
  const popularGames = gameService.getGames({ sortBy: 'popular' });
  const offlineGames = gameService.getAllGames().filter(g => g.offlineSupported);
  const quickGames = gameService.getAllGames().filter(g => g.sessionLength?.includes('Quick'));
  const allGames = gameService.getAllGames();

  useEffect(() => {
    // Recently Played games
    const recentIds = storageService.getRecentlyPlayed();
    const resolvedRecents = recentIds
      .map(id => gameService.getGameBySlug(id))
      .filter((g): g is GameDefinition => g !== undefined)
      .slice(0, 6);
    setRecentGames(resolvedRecents);

    // Personalized For You games
    const recs = recommendationService.getPersonalizedRecommendations(6);
    setForYouGames(recs);

    setStreakInfo(streakService.getStreakInfo());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8">
      
      {/* Quick Play & Streak Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-600/10 to-pink-500/10 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-400 text-slate-950 font-black">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide block">
              Instant Mobile Gaming Platform
            </span>
            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-rose-400" /> DAILY STREAK: {streakInfo.currentStreak} DAYS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="primary" size="sm" fullWidth onClick={() => setIsQuickPlayOpen(true)}>
            <Dices className="w-4 h-4" /> SURPRISE ME 🎲
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <GameHero featuredGame={featuredGame} />

      {/* Continue Playing (If recent games exist) */}
      {recentGames.length > 0 && (
        <GameCarousel
          title="🎮 Continue Playing"
          subtitle="Jump straight back into your recent games"
          games={recentGames}
        />
      )}

      {/* Daily Quests / Challenges Row */}
      <section className="my-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Today's Quests & Challenges
            </h2>
            <p className="text-xs text-slate-400">Complete challenges to earn XP and level up!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {challenges.map(ch => (
            <DailyChallengeCard key={ch.id} challenge={ch} />
          ))}
        </div>
      </section>

      {/* For You Recommendations */}
      {forYouGames.length > 0 && (
        <GameCarousel
          title="✨ For You"
          subtitle="Recommended based on your favorite genres and play activity"
          games={forYouGames}
        />
      )}

      {/* Game of the Day Showcase */}
      {gameOfTheDay && (
        <section className="relative rounded-3xl overflow-hidden glass-card border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 border border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5" /> GAME OF THE DAY
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white">{gameOfTheDay.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                {gameOfTheDay.description}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link to={`/game/${gameOfTheDay.slug}/play`}>
                  <Button variant="primary" size="md">
                    PLAY GAME OF THE DAY
                  </Button>
                </Link>
                <Link to={`/game/${gameOfTheDay.slug}`}>
                  <Button variant="outline" size="md">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Games Horizontal Carousel */}
      <GameCarousel
        title="🔥 Trending Now"
        subtitle="Most played games across the platform today"
        games={trendingGames}
        actionLink={
          <Link to="/trending" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* Play Offline Section */}
      <GameCarousel
        title="📶 Play Offline"
        subtitle="No internet connection required — play anytime, anywhere"
        games={offlineGames}
      />

      {/* Categories Grid */}
      <section className="my-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Browse Categories</h2>
            <p className="text-xs text-slate-400">Explore games by genre</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES_LIST.slice(0, 4).map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      {/* Have 5 Minutes? Short Session Quick Games */}
      <GameCarousel
        title="⏱️ Have 5 Minutes?"
        subtitle="Super fast games perfect for quick mobile breaks"
        games={quickGames}
      />

      {/* Popular Games Section */}
      <GameCarousel
        title="🏆 Popular Picks"
        subtitle="Top rated by players"
        games={popularGames}
      />

      {/* Main Full Catalog Grid */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">All Instant Games ({allGames.length} Titles)</h2>
            <p className="text-xs text-slate-400">Jump right into the complete ManuPlay catalog</p>
          </div>
          <Link to="/games" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            Full Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <GameGrid games={allGames} />
      </section>

      <QuickPlayModal isOpen={isQuickPlayOpen} onClose={() => setIsQuickPlayOpen(false)} />

    </div>
  );
};
