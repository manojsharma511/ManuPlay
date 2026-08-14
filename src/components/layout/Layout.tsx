import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isGamePlayPage = location.pathname.endsWith('/play');

  if (isGamePlayPage) {
    // Game shell full screen without standard layout chrome
    return (
      <main className="w-full h-full min-h-svh bg-slate-950">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-[#0a0c14] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};
