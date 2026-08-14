import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Settings, Flame, Gamepad2, Sparkles, User } from 'lucide-react';
import { storageService } from '../../services/StorageService';
import { userService } from '../../services/UserService';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [favCount, setFavCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const profile = userService.getProfile();

  useEffect(() => {
    const updateFavs = () => {
      setFavCount(storageService.getFavorites().length);
    };
    updateFavs();
    window.addEventListener('storage', updateFavs);
    return () => window.removeEventListener('storage', updateFavs);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: Sparkles },
    { label: 'Games', path: '/games', icon: Gamepad2 },
    { label: 'Trending', path: '/trending', icon: Flame },
    { label: 'Favorites', path: '/favorites', icon: Heart, badge: favCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-lg tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                M
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-wider text-white group-hover:text-cyan-400 transition-colors">
              MANU<span className="text-cyan-400">PLAY</span>
            </span>
            <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-widest -mt-1 hidden sm:inline-block">
              Mobile Web Gaming
            </span>
          </div>
        </Link>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search games, tags, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
        </form>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Mobile Icons */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <Link
            to="/search"
            className="md:hidden p-2.5 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800 active:scale-95 transition-all"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Profile / Settings Button */}
          <Link
            to="/settings"
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 active:scale-95 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              <User className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate text-slate-200">
              {profile.username}
            </span>
            <Settings className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
          </Link>
        </div>

      </div>
    </header>
  );
};
