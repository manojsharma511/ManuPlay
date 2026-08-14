import React, { useState } from 'react';
import { User, Trophy, Sparkles, Heart, History, Award } from 'lucide-react';
import { userService } from '../services/UserService';
import { progressionService } from '../services/ProgressionService';
import { achievementService } from '../services/AchievementService';
import { storageService } from '../services/StorageService';
import { gameService } from '../services/GameService';
import { AvatarCustomizer } from '../components/profile/AvatarCustomizer';
import { GameGrid } from '../components/game-ui/GameGrid';

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'mastery' | 'favorites' | 'history'>('overview');
  const profile = userService.getProfile();
  const levelInfo = progressionService.getLevelInfo();
  const achievements = achievementService.getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const favIds = storageService.getFavorites();
  const favGames = gameService.getAllGames().filter(g => favIds.includes(g.id));

  const recentIds = storageService.getRecentlyPlayed();
  const recentGames = recentIds.map(id => gameService.getGameBySlug(id)).filter((g): g is any => g !== undefined);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Player Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-cyan-500/20 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-xl border-2 border-white/20">
              <User className="w-10 h-10 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.username}</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  GUEST PLAYER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Joined ManuPlay • Total Score: {profile.totalScore.toLocaleString()} pts
              </p>
            </div>
          </div>

          {/* Level Badge Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">PLAYER LEVEL</span>
            <h3 className="text-3xl font-black text-white mt-0.5">LEVEL {levelInfo.level}</h3>
          </div>

        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>XP Progress ({levelInfo.currentXP.toLocaleString()} XP)</span>
            <span>Next Level: {levelInfo.nextLevelXP.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-slate-800 pb-3">
        {[
          { key: 'overview', label: 'Overview', icon: Sparkles },
          { key: 'achievements', label: `Achievements (${unlockedCount}/${achievements.length})`, icon: Trophy },
          { key: 'mastery', label: 'Game Mastery', icon: Award },
          { key: 'favorites', label: `Favorites (${favGames.length})`, icon: Heart },
          { key: 'history', label: 'History', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">GAMES PLAYED</span>
              <h4 className="text-2xl font-black text-cyan-400 mt-1">{profile.gamesPlayedCount}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">ACHIEVEMENTS</span>
              <h4 className="text-2xl font-black text-amber-400 mt-1">{unlockedCount} / {achievements.length}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">FAVORITES</span>
              <h4 className="text-2xl font-black text-pink-500 mt-1">{favGames.length}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">PLAYER LEVEL</span>
              <h4 className="text-2xl font-black text-purple-400 mt-1">LVL {levelInfo.level}</h4>
            </div>
          </div>

          {/* Avatar Customizer */}
          <AvatarCustomizer />
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                ach.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="p-3 rounded-xl bg-slate-950 text-2xl shrink-0">
                {ach.icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white">{ach.title}</h4>
                  {ach.unlocked && <span className="text-[10px] font-black text-amber-400 uppercase">UNLOCKED</span>}
                </div>
                <p className="text-xs text-slate-300">{ach.description}</p>
                <span className="inline-block text-[10px] font-bold text-cyan-400 pt-1">
                  +{ach.xpReward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mastery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gameService.getAllGames().map(game => {
            const mastery = progressionService.getGameMastery(game.id);
            const badgeNames = ['Unranked', 'Bronze 🥉', 'Silver 🥈', 'Gold 🥇', 'Diamond 💎'];

            return (
              <div key={game.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-white">{game.title}</h4>
                  <p className="text-xs text-slate-400">
                    High Score: {mastery.highScore.toLocaleString()} • Plays: {mastery.totalPlays}
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-cyan-400 text-center">
                  {badgeNames[mastery.level]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'favorites' && <GameGrid games={favGames} />}

      {activeTab === 'history' && <GameGrid games={recentGames} />}

    </div>
  );
};
