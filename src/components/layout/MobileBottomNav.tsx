import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Flame, Heart, Settings } from 'lucide-react';
import { storageService } from '../../services/StorageService';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const updateFavs = () => {
      setFavCount(storageService.getFavorites().length);
    };
    updateFavs();
    window.addEventListener('storage', updateFavs);
    return () => window.removeEventListener('storage', updateFavs);
  }, [location.pathname]);

  // Hide bottom nav when inside game play mode
  if (location.pathname.endsWith('/play')) return null;

  const items = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Games', path: '/games', icon: Gamepad2 },
    { label: 'Trending', path: '/trending', icon: Flame },
    { label: 'Favorites', path: '/favorites', icon: Heart, badge: favCount },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/80 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-black rounded-full bg-cyan-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
