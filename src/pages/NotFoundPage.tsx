import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Play } from 'lucide-react';
import { Button } from '../components/common/Button';
import { SEO } from '../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
      <SEO
        title="404 Page Not Found"
        description="The requested stage or URL was not found on ManuPlay."
        noindex={true}
      />
      
      {/* 404 Glitch Badge */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-cyan-500/10 animate-ping" />
        <div className="relative p-6 rounded-3xl bg-slate-900 border-2 border-cyan-400 text-cyan-400 shadow-2xl shadow-cyan-500/20">
          <Gamepad2 className="w-14 h-14" />
        </div>
      </div>

      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-widest uppercase">
        ERROR 404 • STAGE MISSING
      </span>

      <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
        Looks like this level doesn't exist.
      </h1>

      <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
        The stage or URL you requested could not be found. Head back to the main lobby to choose another game!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link to="/">
          <Button variant="primary" size="lg">
            <ArrowLeft className="w-5 h-5" /> BACK TO MANUPLAY
          </Button>
        </Link>
        <Link to="/games">
          <Button variant="outline" size="lg">
            <Play className="w-5 h-5 fill-white" /> PLAY A GAME
          </Button>
        </Link>
      </div>

    </div>
  );
};
