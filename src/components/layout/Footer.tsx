import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Shield, Heart, Zap, Globe, Lock, HelpCircle, FileText } from 'lucide-react';
import { CATEGORIES_LIST } from '../../games/registry';
import { SITE_CONFIG } from '../../config/site';

export const Footer: React.FC = () => {
  const landingPages = [
    { title: 'Free Online Games', slug: '/free-games' },
    { title: 'Multiplayer Games', slug: '/multiplayer-games' },
    { title: '2 Player Games', slug: '/2-player-games' },
    { title: 'Mobile Games', slug: '/mobile-games' },
    { title: 'Browser Games', slug: '/browser-games' },
    { title: 'All Instant Games', slug: '/online-games' },
  ];

  return (
    <footer className="bg-slate-950/90 border-t border-slate-800/80 text-slate-400 text-xs mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Top Brand Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand Intro */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-white text-xl font-black tracking-tight">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-md">
                <Gamepad2 className="w-5 h-5 fill-slate-950" />
              </div>
              <span>MANU<span className="text-cyan-400">PLAY</span></span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              ManuPlay is a high-performance instant HTML5 browser gaming platform. Play 100+ top free online games on mobile, tablet, and desktop with zero downloads and instant saved progress.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-cyan-400" /> Instant Play</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Safe & Verified</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-purple-400" /> Web Standard</span>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h3 className="text-white font-extrabold uppercase tracking-wider text-[11px]">Game Categories</h3>
            <ul className="space-y-2">
              {CATEGORIES_LIST.slice(0, 7).map(cat => (
                <li key={cat.slug}>
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.name} Games</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/games" className="text-cyan-400 font-bold hover:underline">
                  View All Categories →
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured Collections */}
          <div className="space-y-3">
            <h3 className="text-white font-extrabold uppercase tracking-wider text-[11px]">Popular Collections</h3>
            <ul className="space-y-2">
              {landingPages.map(lp => (
                <li key={lp.slug}>
                  <Link 
                    to={lp.slug} 
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {lp.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Trust Links */}
          <div className="space-y-3">
            <h3 className="text-white font-extrabold uppercase tracking-wider text-[11px]">About & Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> About ManuPlay
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" /> Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.legalName}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for web gamers worldwide</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
