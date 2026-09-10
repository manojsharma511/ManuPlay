import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Flame, Star, Zap, Gamepad2, Shield } from 'lucide-react';
import type { GameDefinition } from '../../games/types';

interface GameHeroProps {
  featuredGame?: GameDefinition;
}

export const GameHero: React.FC<GameHeroProps> = ({ featuredGame }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950/80 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 p-5 sm:p-8 my-4 select-none">
      
      {/* Background Ambient Glows */}
      <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Column Text Content */}
        <div className="md:col-span-7 space-y-4 text-left">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-black tracking-wider uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> INSTANT BROWSER GAMING
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black tracking-wider uppercase">
              <Shield className="w-3 h-3" /> ZERO INSTALLS
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            PLAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 animate-pulse">INSTANTLY</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl font-medium leading-relaxed">
            Your next game is one tap away. Zero downloads, zero ads — 100% free web games optimized for mobile devices and desktop.
          </p>

          {/* Featured Game Info Quick Pills */}
          {featuredGame && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-extrabold text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> {featuredGame.rating} Rating
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-extrabold text-rose-400 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-rose-400" /> #1 Trending Game
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-extrabold text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> {(featuredGame.plays / 1000).toFixed(0)}k Players
              </span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {featuredGame ? (
              <Link to={`/games/${featuredGame.slug}/play`} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all active:scale-95 cursor-pointer">
                  <Play className="w-4 h-4 fill-slate-950" /> PLAY FEATURED GAME
                </button>
              </Link>
            ) : (
              <Link to="/games" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all active:scale-95 cursor-pointer">
                  <Play className="w-4 h-4 fill-slate-950" /> PLAY NOW
                </button>
              </Link>
            )}

            <Link to="/games" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer">
                <Gamepad2 className="w-4 h-4 text-cyan-400" /> EXPLORE CATALOG
              </button>
            </Link>
          </div>

        </div>

        {/* Right Column Featured Card Graphic */}
        {featuredGame && (
          <div className="md:col-span-5 w-full">
            <Link to={`/games/${featuredGame.slug}`} className="group relative block rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-cyan-500/20 active:scale-98 transition-transform">
              
              <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-900">
                {featuredGame.coverImage ? (
                  <img
                    src={featuredGame.coverImage}
                    alt={featuredGame.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                    style={{ background: featuredGame.thumbnailBg }}
                  >
                    <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/20 text-cyan-400 shadow-2xl mb-2">
                      <Zap className="w-10 h-10" />
                    </div>
                    <h3 className="font-black text-2xl text-white tracking-wide">{featuredGame.title}</h3>
                  </div>
                )}

                {/* Glassmorphic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white drop-shadow-md">
                      {featuredGame.title}
                    </span>
                    <span className="text-[11px] font-extrabold text-cyan-400">
                      {featuredGame.tagline}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                    PLAY FREE
                  </span>
                </div>
              </div>

              {/* Play Badge Overlay */}
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="px-6 py-3 rounded-full bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-cyan-400/50 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 fill-slate-950" /> Launch Game
                </div>
              </div>

            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
