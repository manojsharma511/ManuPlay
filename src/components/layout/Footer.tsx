import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Heart } from 'lucide-react';
import { CATEGORIES_LIST } from '../../games/registry';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-auto pb-20 sm:pb-8 pt-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          
          {/* Brand & Vision */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-bold text-cyan-400 text-sm">
                  M
                </div>
              </div>
              <span className="font-black text-lg tracking-wider text-white">
                MANU<span className="text-cyan-400">PLAY</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              ManuPlay is a high-performance, mobile-first browser gaming platform. Play 100% free HTML5 games instantly with zero downloads or registration.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400/90 pt-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Safe, Local & Instant
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 tracking-wide uppercase text-xs">Explore</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Home Platform</Link></li>
              <li><Link to="/games" className="hover:text-cyan-400 transition-colors">All Games Catalog</Link></li>
              <li><Link to="/trending" className="hover:text-cyan-400 transition-colors">Trending Now</Link></li>
              <li><Link to="/favorites" className="hover:text-cyan-400 transition-colors">My Favorites</Link></li>
              <li><Link to="/recent" className="hover:text-cyan-400 transition-colors">Recently Played</Link></li>
            </ul>
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 tracking-wide uppercase text-xs">Categories</h4>
            <ul className="space-y-2 text-xs font-medium">
              {CATEGORIES_LIST.slice(0, 5).map(cat => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-cyan-400 transition-colors">
                    {cat.name} Games
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Performance & Storage Info */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 tracking-wide uppercase text-xs">Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Powered by React, TypeScript, Phaser 3, Web Audio API, and local IndexedDB save states.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Zap className="w-3.5 h-3.5" /> PWA Ready
              </div>
              <p>Install to home screen for native full-screen app experience.</p>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ManuPlay Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            Designed for mobile gamers with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 mx-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
};
