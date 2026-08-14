import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Zap } from 'lucide-react';
import type { GameDefinition } from '../../games/types';
import { Button } from '../common/Button';

interface GameHeroProps {
  featuredGame?: GameDefinition;
}

export const GameHero: React.FC<GameHeroProps> = ({ featuredGame }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-card border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-5 sm:p-8 my-4">
      {/* Background Ambient Glow */}
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Column Text Content */}
        <div className="md:col-span-7 space-y-3.5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Instant Browser Gaming
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            PLAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">INSTANTLY</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg font-medium leading-relaxed">
            Your next game is one tap away. Zero downloads, zero registration — 100% free web games optimized for mobile phones.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {featuredGame ? (
              <Link to={`/game/${featuredGame.slug}/play`}>
                <Button variant="primary" size="lg">
                  <Play className="w-5 h-5 fill-slate-950" /> PLAY NOW
                </Button>
              </Link>
            ) : (
              <Link to="/games">
                <Button variant="primary" size="lg">
                  <Play className="w-5 h-5 fill-slate-950" /> PLAY NOW
                </Button>
              </Link>
            )}

            <Link to="/games">
              <Button variant="outline" size="lg">
                EXPLORE CATALOG
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column Featured Card Preview */}
        {featuredGame && (
          <div className="md:col-span-5 hidden sm:block">
            <Link to={`/game/${featuredGame.slug}`} className="group relative block rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl">
              <div 
                className="aspect-[16/10] w-full flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-500"
                style={{ background: featuredGame.thumbnailBg }}
              >
                <div className="p-4 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 text-white shadow-2xl mb-2">
                  <Zap className="w-10 h-10" />
                </div>
                <h3 className="font-black text-2xl text-white tracking-wide">{featuredGame.title}</h3>
                <span className="text-xs font-bold text-slate-200 mt-1 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-700">
                  {featuredGame.category} • ★ {featuredGame.rating}
                </span>
              </div>

              {/* Play Badge Overlay */}
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="px-5 py-2.5 rounded-full bg-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-cyan-400/40">
                  <Play className="w-4 h-4 fill-slate-950" /> Quick Play
                </div>
              </div>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
